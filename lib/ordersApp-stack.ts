import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamobdb from 'aws-cdk-lib/aws-dynamodb'
import * as cdk from 'aws-cdk-lib'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

interface OrdersAppStackProps extends cdk.StackProps {
  productsTable: dynamobdb.Table,
  eventsTable: dynamobdb.Table
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
    // ORDER EVENTS LAYER
    const orderEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrderEventsLayerVersionArn')
    const orderEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'OrderEventsLayerVersionArn', orderEventsLayerArn)
    // ORDER EVENTS REPOSITORY LAYER
    const orderEventsRepositoryLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrderEventsRepositoryLayerVersionArn')
    const orderEventsRepositoryLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'OrderEventsRepositoryLayerVersionArn', orderEventsRepositoryLayerArn)
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
        PRODUCTS_TABLE: props.productsTable.tableName,
        ORDER_EVENTS_TOPIC_ARN: orderTopic.topicArn
      },
      layers: [ordersLayer, ordersApiLayer, productsLayer, orderEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    // TOPIC ACCESS PERMISSIONS
    orderTopic.grantPublish(this.ordersHandler)
    // TABLES ACCESS PERMISSIONS
    ordersTable.grantReadWriteData(this.ordersHandler)
    props.productsTable.grantReadData(this.ordersHandler)

    // ORDER EVENTS LAMBDA
    const orderEventsHandler = new lambdaNodeJS.NodejsFunction(this, 'OrderEventsFunction', {
      functionName: 'OrderEventsFunction',
      entry: 'lambda/orders/ordersEventsFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        EVENTS_TABLE: props.eventsTable.tableName
      },
      layers: [orderEventsLayer, orderEventsRepositoryLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    // TOPIC ACCESS PERMISSIONS
    orderTopic.addSubscription(new subs.LambdaSubscription(orderEventsHandler))

    // ORDER EVENT TABLE POLICY
    const eventsTablePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamobdb:PutItem'],
      resources: [props.eventsTable.tableArn],
      conditions: {
        ['ForAllValues:StringLike']: {
          'dynamodb: LeadingKeys': ['#order_*']
        }
      },
    })
    orderEventsHandler.addToRolePolicy(eventsTablePolicy)

  }
}