import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamobdb from 'aws-cdk-lib/aws-dynamodb'
import * as cdk from 'aws-cdk-lib'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

interface ProductsAppStackProps extends cdk.StackProps {
  eventsDdb: dynamobdb.Table
}

export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJS.NodejsFunction
  readonly productsAdminHandler: lambdaNodeJS.NodejsFunction
  readonly productsTable: dynamobdb.Table

  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
    super(scope, id, props)

    // PRODUCT DYNAMO
    this.productsTable = new dynamobdb.Table(this, 'ProductsTable', {
      partitionKey: {
        name: 'id',
        type: dynamobdb.AttributeType.STRING
      },
      tableName: 'products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamobdb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    })

    // PRODUCT LAYER
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsLayerVersionArn')
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductsLayerVersionArn', productsLayerArn)
    
    // PRODUCT EVENT LAYER
    const productEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductEventsLayerVersionArn')
    const productEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductEventsLayerVersionArn', productEventsLayerArn)

    // PRODUCT EVENT LAMBDA
    const productEventsHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductEventsFunction', {
      functionName: 'ProductEventsFunction',
      entry: 'lambda/products/productEventsFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        EVENTS_DDB: props.eventsDdb.tableName
      },
      layers: [productEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    props.eventsDdb.grantWriteData(productEventsHandler)

    // PRODUCT FETCH LAMBDA
    this.productsFetchHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsFetchFunction', {
      functionName: 'ProductsFetchFunction',
      entry: 'lambda/products/productsFetchFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        PRODUCTS_TABLE_NAME: this.productsTable.tableName
      },
      layers: [productsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    this.productsTable.grantReadData(this.productsFetchHandler)

    // PRODUCT ADMIN LAMBDA
    this.productsAdminHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsAdminFunction', {
      functionName: 'ProductsAdminFunction',
      entry: 'lambda/products/productsAdminFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        PRODUCTS_TABLE_NAME: this.productsTable.tableName,
        PRODUCT_EVENTS_FUCTION_NAME: productEventsHandler.functionName
      },
      layers: [productsLayer, productEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    this.productsTable.grantReadWriteData(this.productsAdminHandler)
    productEventsHandler.grantInvoke(this.productsAdminHandler)
  }
}