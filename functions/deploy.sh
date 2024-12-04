#!/bin/bash

FUNCTION_NAME="MyLambdaFunction"
ZIP_FILE="lambda_function.zip"
ROLE_ARN="arn:aws:iam::123456789012:role/service-role/MyLambdaRole"
HANDLER="app.lambda_handler"
RUNTIME="python3.10"

rm -rf deploy
mkdir -p deploy
cd deploy

cp ../app.py .
cp ../requirements.txt .
pip install -r requirements.txt -t .

zip -r ${ZIP_FILE} .

if aws lambda get-function --function-name ${FUNCTION_NAME} >/dev/null 2>&1; then
  echo "Lambda is already exists,, update lambda"

  awslocal lambda update-function-code \
    --function-name ${FUNCTION_NAME} \
    --zip-file fileb://${ZIP_FILE}

  awslocal lambda update-function-configuration \
    --function-name ${FUNCTION_NAME} \
    --environment Variables="{CHROMECAST_DEVICE_IP=192.168.7.8}"
else
  echo "Creating new lambda ..."

  awslocal lambda create-function \
    --function-name ${FUNCTION_NAME} \
    --runtime ${RUNTIME} \
    --role ${ROLE_ARN} \
    --handler ${HANDLER} \
    --environment Variables="{CHROMECAST_DEVICE_IP=192.168.7.8}" \
    --zip-file fileb://${ZIP_FILE} --timeout 60
fi

cd ..
rm -rf
