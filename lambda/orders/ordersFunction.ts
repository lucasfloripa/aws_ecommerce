import { DynamoDB } from "aws-sdk"
import * as AWSXRay from 'aws-xray-sdk'
import { OrderRepository } from "/opt/nodejs/ordersLayer"
import { ProductRepository } from "/opt/nodejs/productsLayer"
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"

AWSXRay.captureAWS(require('aws-sdk'))
const ordersTable = process.env.ORDERS_TABLE!
const productsTable = process.env.PRODUCTS_TABLE!

const ddbClient = new DynamoDB.DocumentClient()

const orderRepository = new OrderRepository(ddbClient, ordersTable)
const productRepository = new ProductRepository(ddbClient, productsTable)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const method = event.httpMethod
  const apiRequestId = event.requestContext.requestId
  const lambdaRequest = context.awsRequestId

  console.log(`API Gateway Request: ${apiRequestId} - LambdaRequestId: ${lambdaRequest}`)

  if (method === 'GET') {
    if (event.queryStringParameters) {
      const email = event.queryStringParameters!.email
      const orderId = event.queryStringParameters!.orderId
      if (email) {
        if (orderId) {

        } else {

        }
      }
    } else {

    }
  } else if (method === 'POST') {
    console.log('POST /orders')

  } else if (method === 'DELETE') {
    console.log('DELETE /orders')
    const email = event.queryStringParameters!.email
    const orderId = event.queryStringParameters!.orderId
  }

  return {
    statusCode: 400,
    body: 'Bad Request'
  }
}