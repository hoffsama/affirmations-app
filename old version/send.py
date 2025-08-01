import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='message_broker')

channel.basic_publish(exchange='', routing_key='message_broker', body='This is a message from CS361')
print("Sent: 'This is a message from CS361'")
connection.close()