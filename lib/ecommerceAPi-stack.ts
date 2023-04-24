import * as cdk from 'aws-cdk-lib'
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cwlogs from 'aws-cdk-lib/aws-cloudwatch'
import { Construct } from 'constructs'

interface EcommerceApiStackProps extends cdk.StackProps {
  productsFetchFunction: lambdaNodeJS.NodejsFunction
}

export class EcommerceApiStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: EcommerceApiStackProps) {
    super(scope, id, props)

    const api = new apigateway.RestApi(this, 'ECommerceApi', {
      restApiName: 'ECommerceApi',
    })

    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchFunction)
    
    // 'products' is the resource name
    const productsResource = api.root.addResource('products')
    productsResource.addMethod('GET', productsFetchIntegration)
  }
}