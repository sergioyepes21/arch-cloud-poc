import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEventV2WithJWTAuthorizer, Context } from "aws-lambda";

export const handler = async (
  {
    body,
  }: APIGatewayProxyEventV2WithJWTAuthorizer,
  context: Context,
) => {
  const {
    fileName
  } = JSON.parse(body as string);
  const EXPIRES_IN = +(process.env.EXPIRES_IN ?? 60 * 5);
  const client = new S3Client({ region: process.env.AWS_REGION });
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: fileName });
  const preSignedUrl = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      preSignedUrl: preSignedUrl,
      expiresIn: EXPIRES_IN,
    }),
  };
}