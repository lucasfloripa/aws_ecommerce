import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamobdb from 'aws-cdk-lib/aws-dynamodb'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJS.NodejsFunction
  readonly productsAdminHandler: lambdaNodeJS.NodejsFunction
  readonly productsTable: dynamobdb.Table

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.productsTable = new dynamobdb.Table(this, 'ProductsTable', {
      partitionKey: {
        name: 'id',
        type: dynamobdb.AttributeType.STRING
      },
      tableName: 'products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamobdb.BillingMode.PAY_PER_REQUEST,
      readCapacity: 1,
      writeCapacity: 1,
    })

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
      }
    })

    this.productsTable.grantReadData(this.productsFetchHandler)

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
        PRODUCTS_TABLE_NAME: this.productsTable.tableName
      }
    })
    this.productsTable.grantReadWriteData(this.productsAdminHandler)

  }
}