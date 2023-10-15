import * as Database from '../db.js';
import { User } from '../models/user.model.js';
import { ApiUsage } from '../models/apiUsage.model.js';
import moment from 'moment/moment.js';

export const authorize = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    console.log('Incoming event:', JSON.stringify(event, null, 2));

    let params = event.headers ? event.headers : {};
    const { authorizationToken } = event;

    console.log('Authorization Token:', authorizationToken);

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
        await Database.connectToDatabase();
        console.log('Connected to the database successfully.');

        let _user = await User.aggregate()
            .match({ apiKey: authorizationToken })
            .lookup({ from: 'Plan', localField: 'plan', foreignField: '_id', as: 'plan' })
            .unwind("plan");

        console.log('Fetched user:', JSON.stringify(_user, null, 2));

        if (_user.length === 0) {
            console.log('No user associated with provided API key.');
            return response;
        }

        _user = _user[0];

        const _usage = await ApiUsage.findOneAndUpdate({
            user: _user._id,
            totalRequest: _user.plan.quota,
            day: _user.plan.quota === 'monthly' ? moment().format("MM/YYYY") : moment().format("DD/MM/YYYY")
        }, { $inc: { usage: 1 } }, { upsert: true, new: true });

        console.log('API usage details:', JSON.stringify(_usage, null, 2));

        if (_usage.usage < _usage.totalRequest) {
            response.policyDocument.Statement[0].Effect = 'Allow';
            console.log('User is within the quota. Allowing access.');
        } else {
            console.log('User has exceeded the quota. Denying access.');
        }
    } catch (error) {
        console.log('Error occurred:', error);
    }

    console.log('Final authorizer response:', JSON.stringify(response, null, 2));
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
