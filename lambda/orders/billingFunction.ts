import { SNSEvent, Context } from 'aws-lambda'

<<<<<<< HEAD
export async function handler(event: SNSEvent, context: Context): Promise<void> {
=======
export async function handler(event: SNSEvent) { 
>>>>>>> b76554e729b2ce2eb55d4b3f46894766549fcd4e
  event.Records.forEach(record => {
    console.log(record.Sns)
  })
}