import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>{
  const method = event.httpMethod;
  const lambdaRequestId = context.awsRequestId; // identifica unicamente a execução da função lambda
  const apiRequestId = event.requestContext.requestId; // identifica unicamente a requisição feita a API Gateway

  console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

  if(event.resource === "/products") {
    if( method === "GET") {
      console.log("GET /products")

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'GET Products - OK'
        })
      }
    }
  } else if (event.resource === "/products/{id}") {
    if( method === "GET") {
      const productId = event.pathParameters!.id as string
      console.log(`GET /products/${productId}`)

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'GET Product ID - OK'
        })
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