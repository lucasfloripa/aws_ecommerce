import * as cdk from 'aws-cdk-lib'
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cwlogs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

interface EcommerceApiStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJS.NodejsFunction
  productsAdminHandler: lambdaNodeJS.NodejsFunction
  ordersHandler: lambdaNodeJS.NodejsFunction
}

export class EcommerceApiStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: EcommerceApiStackProps) {
    super(scope, id, props)

    const logGroup = new cwlogs.LogGroup(this, 'ECommerceApiLogs')

    const api = new apigateway.RestApi(this, 'ECommerceApi', {
      restApiName: 'ECommerceApi',
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true
        })
      }
    })

    this.createProductsService(props, api)
    this.createOrdersService(props, api)
  }

  private createProductsService(props: EcommerceApiStackProps, api: apigateway.RestApi) {
    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)
    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler)

    // resources
    const productsRootResource = api.root.addResource('products')
    const productsIdResource = productsRootResource.addResource('{id}')

    // GET '/products'
    productsRootResource.addMethod('GET', productsFetchIntegration)

    // POST '/products'
    productsRootResource.addMethod('POST', productsAdminIntegration)

    // GET '/products/{id}'
    productsIdResource.addMethod('GET', productsFetchIntegration)

    // PUT '/products/{id}'
    productsIdResource.addMethod('PUT', productsAdminIntegration)

    // DELETE '/products/{id}'
    productsIdResource.addMethod('DELETE', productsAdminIntegration)
  }

  private createOrdersService(props: EcommerceApiStackProps, api: apigateway.RestApi) {
    const ordersIntegration = new apigateway.LambdaIntegration(props.ordersHandler)

    // resources
    const ordersRootResource = api.root.addResource('orders')

    // GET '/orders'
    // GET '/orders?email=value'
    // GET '/orders?email=value&orderId=value'
    ordersRootResource.addMethod('GET', ordersIntegration)

    // DELETE '/orders?email=value&orderId=value'
    ordersRootResource.addMethod('DELETE', ordersIntegration)

    // POST '/orders'
    ordersRootResource.addMethod('POST', ordersIntegration)
  }
}