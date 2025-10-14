const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const getExecutorPrivKey = async () => {
    const secretName = "dca-executor-private-key";
    const client = new SecretsManagerClient({region: process.env.AWS_REGION});
    const command = new GetSecretValueCommand({
        SecretId: secretName
    });
    const resp = await client.send(command);
    console.log("resp: ", resp);
}

module.exports = {
    getExecutorPrivKey
};
