import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEventV2WithJWTAuthorizer, Context } from "aws-lambda";


const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler = async (
  {
    rawPath,
    body,
    ...event
  }: APIGatewayProxyEventV2WithJWTAuthorizer,
  context: Context,
) => {
  const {
    email,
    name,
    password
  } = JSON.parse(body as string);
  const command = new SignUpCommand({
    ClientId: process.env.CLIENT_ID,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "name",
        Value: name,
      },
    ],
    Password: password,
    Username: email,
  });
  const signUpCommandResponse = await client.send(command);
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: signUpCommandResponse.UserSub ?? ''
    }),
  }
}