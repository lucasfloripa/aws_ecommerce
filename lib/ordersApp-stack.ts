import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamobdb from 'aws-cdk-lib/aws-dynamodb'
import * as cdk from 'aws-cdk-lib'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import { Construct } from 'constructs'

interface OrdersAppStackProps extends cdk.StackProps {
  productsTable: dynamobdb.Table
}

export class OrdersAppStack extends cdk.Stack {
  readonly ordersHandler: lambdaNodeJS.NodejsFunction

  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
    super(scope, id, props)

    // ORDERS TABLE
    const ordersTable = new dynamobdb.Table(this, 'OrdersTable', {
      tableName: 'orders',
      partitionKey: {
        name: 'pk',
        type: dynamobdb.AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: dynamobdb.AttributeType.STRING
      },
      billingMode: dynamobdb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    })

    // ORDERS LAYER
    const ordersLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrdersLayerVersionArn')
    const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'OrdersLayerVersionArn', ordersLayerArn)
    // ORDERS API LAYER
    const ordersApiLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrdersApiLayerVersionArn')
    const ordersApiLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'OrdersApiLayerVersionArn', ordersApiLayerArn)
    // PRODUCT LAYER
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsLayerVersionArn')
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductsLayerVersionArn', productsLayerArn)

    // ORDERS TOPIC
    const orderTopic = new sns.Topic(this, 'OrderEvetnsTopic', {
      displayName: 'Order events topic',
      topicName: 'order-events'
    })

    // ORDERS LAMBDA
    this.ordersHandler = new lambdaNodeJS.NodejsFunction(this, 'OrdersFunction', {
      functionName: 'OrdersFunction',
      entry: 'lambda/orders/ordersFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        ORDERS_TABLE: ordersTable.tableName,
        PRODUCTS_TABLE: props.productsTable.tableName
      },
      layers: [ordersLayer, ordersApiLayer, productsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    // TABLES ACCESS PERMISSIONS
    ordersTable.grantReadWriteData(this.ordersHandler)
    props.productsTable.grantReadData(this.ordersHandler)
  }
}