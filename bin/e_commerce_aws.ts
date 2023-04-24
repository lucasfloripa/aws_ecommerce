#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcommerceApiStack, ProductsAppStack } from '../lib'

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.AWS_ACCOUNT_ID,
  region: process.env.AWS_REGION
}

const tags = {
  cost: "ECommerce",
  team: "Elciess"
}

const productsAppStack = new ProductsAppStack(app, 'ProductsApp', { env, tags })

const ecommerceApiStack = new EcommerceApiStack(app, 'EcommerceApi', {
  env,
  tags,
  productsFetchFunction: productsAppStack.productsFetchHandler
})

ecommerceApiStack.addDependency(productsAppStack)