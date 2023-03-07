import * as Database from '../db.js'
import { User } from '../models/user.model.js'
import { ApiUsage } from '../models/apiUsage.model.js'
import moment from 'moment/moment.js'


export const authorize = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    let params = event.headers ? event.headers : {};
    const { apiKey } = params;
    console.log(apiKey);
    let response = {
        "principalId": event.authorizationToken,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Deny",
                    "Resource": event.methodArn
                }
            ]
        }
    };

    try {
        await Database.connectToDatabase()
        let _user = await User.aggregate()
            .match({ apiKey })
            .lookup({ from: 'Plan', localField: 'plan', foreignField: '_id', as: 'plan' })
            .unwind("plan");

        if (_user.length === 0) {
            return response;
        }
        console.log(_user);
        _user = _user[0];
        const _usage = await ApiUsage.findOneAndUpdate({
            user: _user._id,
            totalRequest: _user.plan.quota,
            day: _user.plan.quota === 'monthly' ? moment().format("MM/YYYY") : moment().format("DD/MM/YYYY")
        }, { $inc: { usage: 1 } }, { upsert: true, new: true });
        console.log(_usage);
        if (_usage.usage < _usage.totalRequest) {
            response.policyDocument.Statement[0].Effect = 'Allow';
        }
    } catch (error) {
        console.log(error);
    }
    console.log("Authorized successfully");
    console.log(response);
    return response;
};

export function demoApi(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    let params = event.queryStringParameters ? event.queryStringParameters : {};
    const { apiKey } = params;
    callback(null, {
        statusCode: 200,
        body: JSON.stringify(params),
    });
}