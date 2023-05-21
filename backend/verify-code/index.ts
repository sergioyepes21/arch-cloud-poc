import { AdminInitiateAuthCommand, CognitoIdentityProviderClient, ConfirmSignUpCommand, VerifyUserAttributeCommand } from "@aws-sdk/client-cognito-identity-provider";
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
    username,
    code,
  } = JSON.parse(body as string);
  const command = new ConfirmSignUpCommand({
    ClientId: process.env.CLIENT_ID,
    ConfirmationCode: code,
    Username: username,
  });
  await client.send(command);
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username
    }),
  };
}