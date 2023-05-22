import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DynamoDB, Lambda } from "aws-sdk";
import { ProductEvent, ProductEventType } from "/opt/nodejs/productEventsLayer";
import * as AWSXRay from 'aws-xray-sdk'
import { Product, ProductRepository } from "/opt/nodejs/productsLayer";

AWSXRay.captureAWS(require("aws-sdk"))

const productsTable = process.env.PRODUCTS_TABLE_NAME!
const productEventFunctionName = process.env.PRODUCT_EVENT_FUNCTION_NAME!
const ddbClient = new DynamoDB.DocumentClient()
const lambdaClient = new Lambda()
const productRepository = new ProductRepository(ddbClient, productsTable)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>{
  const method = event.httpMethod;
  const lambdaRequestId = context.awsRequestId; // identifica unicamente a execução da função lambda
  const apiRequestId = event.requestContext.requestId; // identifica unicamente a requisição feita a API Gateway

  console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

  if(event.resource === '/products') {
    console.log('POST /products') 

    const product = JSON.parse(event.body!) as Product

    const productCreated = await productRepository.createProduct(product)

    const response = await sendProductEvent(productCreated, ProductEventType.CREATED, 'lucas@gmail.com', lambdaRequestId)

    console.log(response)

      return {
        statusCode: 201,
        body: JSON.stringify(productCreated)
      }
  } else if(event.resource === '/products/{id}') {
    const productId = event.pathParameters!.id as string

    const product = JSON.parse(event.body!) as Product

    const productUpdated = await productRepository.updateProduct(productId, product)

    const response = await sendProductEvent(productUpdated, ProductEventType.UPDATED, 'lucas@gmail.com', lambdaRequestId)

    console.log(response)

    if(method === 'PUT') {
    console.log(`PUT /products/${productId}`) 
      return {
        statusCode: 200,
        body: JSON.stringify(productUpdated)
      }
    }
    if(method === 'DELETE') {
      console.log(`DELETE /products/${productId}`) 

      const productDeleted = await productRepository.deleteProduct(productId)

      const response = await sendProductEvent(productDeleted, ProductEventType.DELETED, 'lucas@gmail.com', lambdaRequestId)

      console.log(response)
  
      return {
        statusCode: 200,
        body: JSON.stringify(productDeleted)
      }
    }
  }

  return {
    statusCode: 400,
    body: 'Bad Request'
  }
}

function sendProductEvent(product: Product, eventType: ProductEventType, email: string, lambdaRequestId: string) { 

  const event: ProductEvent = {
    email,
    eventType,
    productCode: product.code,
    productId: product.id,
    productPrice: product.price,
    requestId: lambdaRequestId,
  }

  return lambdaClient.invoke({
    FunctionName: productEventFunctionName,
    Payload: JSON.stringify(event),
    InvocationType: 'RequestResponse' // invocação syncrona
  }).promise()
}