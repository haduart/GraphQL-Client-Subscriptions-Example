import React, {Component} from 'react';

import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import {ApolloProvider, ApolloConsumer, Query, Subscription} from "react-apollo";
import {split} from 'apollo-link';
import {HttpLink} from 'apollo-link-http';
import {WebSocketLink} from 'apollo-link-ws';
import {getMainDefinition} from 'apollo-utilities';
import {InMemoryCache} from "apollo-cache-inmemory";

import logo from './logo.svg';
import './App.css';

const httpLink = new HttpLink({
    uri: 'http://localhost:4010/graphql/'
});

const wsLink = new WebSocketLink({
    uri: `ws://localhost:4010/subscriptions`,
    options: {
        reconnect: true
    }
});

const link = split(
    ({query}) => {
        const {kind, operation} = getMainDefinition(query);
        return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    httpLink,
);

const client = new ApolloClient({
    link,
    cache: new InMemoryCache()
});


client.query({
    query: gql`
        {
            users {
                id
                displayName
            }
        }
    `
})
.then(result => console.log(result));

const COMMENTS_SUBSCRIPTION = gql`
    subscription subscribeMessages($chatRoomId: Int!) {
        messageAdded(chatroomId:$chatRoomId) {
            id
            text
        }
    }
`;

const subscribeToMessages = (chatRoomId) => (
    <Subscription
        subscription={COMMENTS_SUBSCRIPTION}
        variables={{chatRoomId}}>

        {({data, loading, error}) => {
            if (loading) return <p>Subscription Loading...</p>;
            if (error) return <p>Subscription Something went wrong</p>;

            return (
                <h4>New comment: {data.messageAdded.text}</h4>
            )
        }
        }
    </Subscription>
)

const queryWithApolloConsumer = () => (
    <ApolloConsumer>
        {client => {
            client
                .query({
                    query: gql` {
                                        chatroom(id:1) {
                                            id
                                            title
                                          }
                                     }
                                 `
                })
                .then(result => console.log(result));
            return null;
        }}
    </ApolloConsumer>
)

const queryUsers = () => (
    <Query
        query={gql` {
                      users {
                            id
                            displayName
                        }
                    }
                  `}
    >
        {({data, loading, error}) => {
            if (loading) return <p>Loading...</p>;
            if (error) return <p>Something went wrong</p>;

            return (
                <ul>
                    {data.users.map(({id, displayName}) =>
                        <li key={id}>{displayName}</li>
                    )}
                </ul>
            )
        }}
    </Query>
)

class App extends Component {
    render() {
        return (
            <ApolloProvider client={client}>
                <div className="App">
                    <header className="App-header">
                        <img src={logo} className="App-logo" alt="logo"/>
                        <p>
                            Edit <code>src/App.js</code> and save to reload. 2
                        </p>
                        <a
                            className="App-link"
                            href="https://reactjs.org"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Learn React
                        </a>
                    </header>

                    {queryWithApolloConsumer()}

                    {subscribeToMessages(1)}

                    {queryUsers()}

                </div>
            </ApolloProvider>
        );
    }
}

export default App;
