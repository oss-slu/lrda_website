import AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager({
  region: 'us-east-2',  // Specify your AWS region
});

interface SecretObject {
  [key: string]: string;
}

export async function getSecretValue(secretName: string): Promise<SecretObject | undefined> {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    
    // Ensure that SecretString is defined and return a parsed value
    if (data.SecretString) {
      return JSON.parse(data.SecretString);
    } else if (data.SecretBinary) {
      const buff = Buffer.from(data.SecretBinary as string, 'base64');
      return JSON.parse(buff.toString('ascii'));
    }
  } catch (err) {
    console.error('Error retrieving secret:', err);
    throw err;
  }
}



// // Use this code snippet in your app.
// // If you need more information about configurations or implementing the sample code, visit the AWS docs:
// // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started.html

// import {
//     SecretsManagerClient,
//     GetSecretValueCommand,
//   } from "@aws-sdk/client-secrets-manager";
  
//   const secret_name = "WR_User";
  
//   const client = new SecretsManagerClient({
//     region: "us-east-2",
//   });
  
//   let response;
  
//   try {
//     response = await client.send(
//       new GetSecretValueCommand({
//         SecretId: secret_name,
//         VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
//       })
//     );
//   } catch (error) {
//     // For a list of exceptions thrown, see
//     // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
//     throw error;
//   }
  
//   const secret = response.SecretString;
  
//   // Your code goes here