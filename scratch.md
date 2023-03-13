## ....

\*Command

- these are the values sent to aws, in this case in order to control dynamodb
- access by mockSend.mock.calls[X][0].input;
- verify
  - TableName
  - Item.\*

for PutCommand, writes, we do not expect any return value

- no need to mock result

for Get- and QueryCommand

- mockSend.mockReturnValueOnce(<result>).<chained>
  - this result is of type GetCommandOutput, QueryCommandOutput etc.
    - has field Item or Items
      - this field contains the expected fetch

Mocking dynamodb calls
define result value - is a GetCommandOutput, QueryCommandOutput, etc.
contains Item or Items with value of expected result

    then catch mockSend.calls[X][0].input
    verify .TableName, and various .Item fields

## .....

undefined values

- storing an object into dynamodb
- one field has an undefied value, the field is optional
- DynamoDBClient doesnt haven an option to filter it away
- crashes

- could filter undefined before client.send on write, update

  - would have to remember to do in many places

- could use DynamoDBDocumentClient
  - was harder to mock
- ultimately should test dynamodb locally
  - can assert against the principal solution on those undefined fiels
  - therell be other such details that'll be hard to track in mocks
  - there will be similart things with other aws resources
    - tho dynamodb is probably one of the most complex use cases
      - therell be a variety of lambdas
      - doing different read and write operations
      - over the same data
      - this complexity is driven by the intrinsinc design of dynamodb

plan

- for this project, leave dynamodb untested

  - this project is for those mocks - we have something to come back to
  - only test the last function - voteOnIdea - then consider closed for now

- might have to use DynamoDBDocumentClient anyway

  - we can assert agains what comes out of db
  - intrinsincly means this data also went in to db
  - we can, but it might be an overkill to, spy on the data that we send in

- might be better to run dynamodb locally in tests
  - could spy to assert input
  - must assert against what actually is retrieved from dynamodb after processing a use case
