#!/bin/bash

rm -rf deploy
mkdir -p deploy
cd deploy

cp ../app.py .
cp ../requirements.txt .
pip install -r requirements.txt -t .

zip -r lambda_function.zip .

awslocal lambda update-function-code --function-name MyLambdaFunction --zip-file fileb://lambda_function.zip

cd ..
rm -rf deploy
