
import { APIGatewayProxyEventV2WithJWTAuthorizer, Context } from "aws-lambda"
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type CloudPaths = 'signup' | 'login' | 'upload-file' | never;

type CloudBodyEvent<P extends CloudPaths> =
  P extends 'signup' ? {
    email: string;
    name: string;
    password: string;
  } :
  P extends 'login' ? {
    username: string;
    password: string;
  } :
  P extends 'upload-file' ? {
    fileExtension: string;
    fileName: string;
  } : never;

type CloudBodyResponse<P extends CloudPaths> =
  P extends 'signup' ? {
    username: string;
  } :
  P extends 'login' ? {
    token: string;
    expiresIn: number;
  } :
  P extends 'upload-file' ? {
    preSignedUrl: string;
    expiresIn: number;
  } : never;

type PathHandler<P extends CloudPaths> = (body: CloudBodyEvent<P>) => Promise<CloudBodyResponse<P>>;

const pathMapper: { [path in CloudPaths]: PathHandler<path> } = {
  "signup": async (body) => {
    const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
    const command = new SignUpCommand({
      ClientId: process.env.CLIENT_ID,
      UserAttributes: [
        {
          Name: "email",
          Value: body.email,
        },
        {
          Name: "name",
          Value: body.name,
        },
      ],
      Password: body.password,
      Username: body.email,
    });
    const signUpCommandResponse = await client.send(command);
    console.log(`"signup": ~ signUpCommandResponse:`, signUpCommandResponse)
    return {
      username: signUpCommandResponse.UserSub ?? '',
    }
  },
  "login": async (body) => {
    const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
    const command = new AdminInitiateAuthCommand({
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.CLIENT_ID,
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      AuthParameters: {
        USERNAME: body.username,
        PASSWORD: body.password,
      },
    });
    const authCommandResponse = await client.send(command);
    console.log(`"login": ~ authCommandResponse:`, authCommandResponse)
    if (!authCommandResponse.AuthenticationResult) {
      return {
        expiresIn: 0,
        token: "",
      }
    }
    return {
      expiresIn: authCommandResponse.AuthenticationResult.ExpiresIn ?? 0,
      token: authCommandResponse.AuthenticationResult.AccessToken ?? "",
    }
  },
  "upload-file": async ({
    fileName,
  }) => {
    const EXPIRES_IN = +(process.env.EXPIRES_IN ?? 60 * 5);
    const client = new S3Client({ region: process.env.AWS_REGION });
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: fileName });
    const preSignedUrl = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN });

    return {
      preSignedUrl: preSignedUrl,
      expiresIn: EXPIRES_IN,
    }
  }
}

export const handler = async (
  {
    rawPath,
    body,
    ...event
  }: APIGatewayProxyEventV2WithJWTAuthorizer,
  context: Context,
) => {
  console.log(`event:`, JSON.stringify(event, null, 2));
  console.log(`body:`, body);
  console.log(`rawPath:`, rawPath);
  const realPath = rawPath.replace(`/${process.env.ENVIRONMENT}/`, "");
  console.log(`realPath:`, realPath);
  const pathHandler = pathMapper[realPath as CloudPaths];
  if (!pathHandler || !body) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Incorrect path or body",
      }),
      headers: {
        "Content-Type": "application/json",
      }
    }
  }
  const bodyToReturn = await pathHandler(JSON.parse(body) as any);
  return {
    statusCode: 200,
    body: JSON.stringify(bodyToReturn),
    headers: {
      "Content-Type": "application/json",
    }
  }
}