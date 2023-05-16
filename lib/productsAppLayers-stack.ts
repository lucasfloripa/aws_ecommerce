import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cdk from 'aws-cdk-lib'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'

export class ProductsAppLayersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // LAYER
    const productsLayer = new lambda.LayerVersion(this, 'ProductsLayer', {
      code: lambda.Code.fromAsset('lambda/products/layers/productsLayer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      layerVersionName: 'ProductsLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    // SSM
    new ssm.StringParameter(this, 'ProductsLayerVersionArn', {
      parameterName: 'ProductsLayerVersionArn',
      stringValue: productsLayer.layerVersionArn
    })

    // LAYER
    const productEventsLayer = new lambda.LayerVersion(this, 'ProductEventsLayer', {
      code: lambda.Code.fromAsset('lambda/products/layers/productEventsLayer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      layerVersionName: 'ProductEventsLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    // SSM
    new ssm.StringParameter(this, 'ProductEventsLayerVersionArn', {
      parameterName: 'ProductEventsLayerVersionArn',
      stringValue: productEventsLayer.layerVersionArn
    })
  }
}