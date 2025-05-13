import { randomBytes } from 'crypto';
import nats, { Message } from 'node-nats-streaming';

const stan = nats.connect('ticketing', randomBytes(4).toString('hex'), {
    url: 'http://localhost:4222'
});