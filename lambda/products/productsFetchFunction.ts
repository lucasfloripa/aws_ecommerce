import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";


export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>{
  const method = event.httpMethod;
  const lambdaRequestId = context.awsRequestId; // identifica unicamente a execução da função lambda
  const apiRequestId = event.requestContext.requestId; // identifica unicamente a requisição feita a API Gateway

  if(event.resource === "/products") {
    if( method === "GET") {
      console.log("GET")

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'GET Products - OK'
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