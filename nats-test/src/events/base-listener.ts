import { Message, Stan } from "node-nats-streaming";
import { Subjects } from "./subjects";


interface IEvent {
    subject: Subjects;
    data: any;
}

export abstract class Listener<T extends IEvent> {
  abstract subject: T['subject'];
  abstract queueGroupName: string;
  abstract onMessage(data: T['data'], msg: Message): void;
  private client: Stan;
  protected ackWait = 5 * 1000;

  constructor(client: Stan) {
    this.client = client;
  }

  subscriptionOptions() {
    return this.client
      .subscriptionOptions()
      .setDeliverAllAvailable()
      .setManualAckMode(true)
      .setAckWait(this.ackWait)
      .setDurableName(this.queueGroupName);
  }

  listen() {
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName,
      this.subscriptionOptions()
    );

    subscription.on("message", (msg: Message) => {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);

      const parsedData = this.parseMessage(msg);
      /**
       * - คลาสลูกจะ implement เอง ว่าจะให้ทำอะไรกับ message ที่ได้รับ
       * - คลาสแม่จะ ไม่รู้รายละเอียด แต่จะ "ไว้ใจ" ให้คลาสลูกจัดการเอง
       */
      this.onMessage(parsedData, msg);
    });
  }

  parseMessage(msg: Message) {
    const data = msg.getData();

    return typeof data === "string"
      ? JSON.parse(data)
      : JSON.parse(data.toString("utf-8"));
  }
}