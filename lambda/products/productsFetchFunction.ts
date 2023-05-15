import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { ProductRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB } from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

AWSXRay.captureAWS(require("aws-sdk"))

const productsTable = process.env.PRODUCTS_TABLE_NAME!
const ddbClient = new DynamoDB.DocumentClient()
const productRepository = new ProductRepository(ddbClient, productsTable)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>{
  const method = event.httpMethod;
  const lambdaRequestId = context.awsRequestId; // identifica unicamente a execução da função lambda
  const apiRequestId = event.requestContext.requestId; // identifica unicamente a requisição feita a API Gateway

  console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

  if(event.resource === "/products") {
    if( method === "GET") {
      console.log("GET /products")

      const products = await productRepository.getAllProducts()

      return {
        statusCode: 200,
        body: JSON.stringify(products)
      }
    }
  } else if (event.resource === "/products/{id}") {
    if( method === "GET") {
      const productId = event.pathParameters!.id as string
      console.log(`GET /products/${productId}`)

      const product = await productRepository.getProductById(productId)
      return {
        statusCode: 200,
        body: JSON.stringify(product)
      }
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Bad Request'
    })
  }
}