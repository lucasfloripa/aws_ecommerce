#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcommerceApiStack, ProductsAppStack, ProductsAppLayersStack, EventsDdbStack, OrderAppLayersStack, OrdersAppStack } from '../lib'

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.AWS_ACCOUNT_ID,
  region: process.env.AWS_REGION
}

const tags = {
  cost: "ECommerce",
  team: "Elciess"
}

const productsAppLayersStack = new ProductsAppLayersStack(app, 'ProductsAppLayers', { env, tags })

const eventsDdbStack = new EventsDdbStack(app, 'EventsDdb', { env, tags })

const productsAppStack = new ProductsAppStack(app, 'ProductsApp', {
  env,
  tags,
  eventsDdb: eventsDdbStack.table
})

const ordersAppLayerStack = new OrderAppLayersStack(app, 'OrdersAppLayers', { env, tags })

const ordersAppStack = new OrdersAppStack(app, 'OrdersApp', {
  tags,
  env,
  productsTable: productsAppStack.productsTable,
  eventsTable: eventsDdbStack.table
})

const ecommerceApiStack = new EcommerceApiStack(app, 'EcommerceApi', {
  env,
  tags,
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  ordersHandler: ordersAppStack.ordersHandler
})

productsAppStack.addDependency(productsAppLayersStack)
productsAppStack.addDependency(eventsDdbStack)
ordersAppStack.addDependency(ordersAppLayerStack)
ordersAppStack.addDependency(productsAppStack)
ecommerceApiStack.addDependency(productsAppStack)
ecommerceApiStack.addDependency(ordersAppStack)