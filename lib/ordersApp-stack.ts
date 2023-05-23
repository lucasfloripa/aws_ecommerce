import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamobdb from 'aws-cdk-lib/aws-dynamodb'
import * as cdk from 'aws-cdk-lib'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

interface OrdersAppStackProps extends cdk.StackProps {
  productsTable: dynamobdb.Table
}

export class OrdersAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
    super(scope, id, props)

    const ordersTable = new dynamobdb.Table(this, 'OrdersTable', {
      tableName: 'orders',
      partitionKey: {
        name: 'pk',
        type: dynamobdb.AttributeType.STRING
      },
      sortKey: {
        name:'sk',
        type: dynamobdb.AttributeType.STRING
      },
      billingMode: dynamobdb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    })
  }
}