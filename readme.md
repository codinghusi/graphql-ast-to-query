Turns your GraphQL AST back to a query.
So you are able to modify the query using the parsed ast.

Example:

```js
import { gql } from "apollo-server";
import { astToQuery } from "./ast-to-query";

const ast = gql`
    query GetUser($userId: ID!) {
        user(id: $userId) {
            id,
            name,
            isViewerFriend,
            profilePicture(size: 50)  {
                ...PictureFragment
            }
        }
    }
    
    fragment PictureFragment on Picture {
        uri,
        width,
        height
    }  
`;

console.log(astToQuery(ast));
```

Returns:
```graphql
query GetUser($userId: ID!){ user(id: $userId) { id, name, isViewerFriend, profilePicture(size: 50) { ...PictureFragment } } }

fragment PictureFragment on Picture { uri, width, height }
```
