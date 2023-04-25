import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>{
  const method = event.httpMethod;
  const lambdaRequestId = context.awsRequestId; // identifica unicamente a execução da função lambda
  const apiRequestId = event.requestContext.requestId; // identifica unicamente a requisição feita a API Gateway

  console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

  if(event.resource === '/products') {
    console.log('POST /products') 
      return {
        statusCode: 201,
        body: 'POST /products - OK'
      }
  } else if(event.resource === '/products/{id}') {
    const productId = event.pathParameters!.id as string
    if(method === 'PUT') {
      console.log(`PUT /products/${productId}`) 
        return {
          statusCode: 200,
          body: 'PUT /products - OK'
        }
    }
    if(method === 'DELETE') {
      console.log(`DELETE /products/${productId}`) 
        return {
          statusCode: 200,
          body: 'DELETE /products - OK'
        }
    }
  }

  return {
    statusCode: 400,
    body: 'Bad Request'
  }
}