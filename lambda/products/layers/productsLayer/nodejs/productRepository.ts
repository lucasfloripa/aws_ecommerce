import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuid } from 'uuid'

export interface Product {
  id: string;
  productName: string
  code: string
  price: number
  model: string
  productUrl: string
}

export class ProductRepository {
  private ddbClient: DocumentClient
  private productsTable: string

  constructor(ddbClient: DocumentClient, productsTable: string) {
    this.ddbClient = ddbClient
    this.productsTable = productsTable
  }

  getAllProducts = async (): Promise<Product[]> => {
    const params = {
      TableName: this.productsTable
    }
    const result = await this.ddbClient.scan(params).promise()
    return result.Items as Product[]
  }

  getProductById = async (id: string): Promise<Product> => {
    const params = {
      TableName: this.productsTable,
      Key: {
        id
      }
    }
    const result = await this.ddbClient.get(params).promise()
    return result.Item as Product
  }

  getProductsByIds = async (productsIds: string[]): Promise<Product[]> => {
    const keys: { id: string }[] = []
    productsIds.forEach(productId => {
      keys.push({
        id: productId
      })
    })
    const data = await this.ddbClient.batchGet({
      RequestItems: {
        [this.productsTable]: {
          Keys: keys
        }
      }
    }).promise()
    return data.Responses![this.productsTable] as Product[]
  }

  createProduct = async (product: Product): Promise<Product> => {
    product.id = uuid()
    const params = {
      TableName: this.productsTable,
      Item: {
        ...product
      }
    }
    await this.ddbClient.put(params).promise()
    return product
  }

  deleteProduct = async (id: string): Promise<Product> => {
    const params = {
      TableName: this.productsTable,
      Key: {
        id
      },
      ReturnValues: 'ALL_OLD'
    }
    const result = await this.ddbClient.delete(params).promise()
    return result.Attributes as Product
  }

  updateProduct = async (id: string, product: Product): Promise<Product> => {
    const params = {
      TableName: this.productsTable,
      Key: {
        id
      },
      UpdateExpression: 'set productName = :productName, code = :code, price = :price, model = :model, productUrl = :productUrl',
      ExpressionAttributeValues: {
        ':productName': product.productName,
        ':code': product.code,
        ':price': product.price,
        ':model': product.model,
        ':productUrl': product.productUrl
      },
      ReturnValues: 'ALL_NEW'
    }
    const result = await this.ddbClient.update(params).promise()
    return result.Attributes as Product
  }
}