import { Ticket } from "../ticket";


it('implement optimistic concurrency control', async () => {
    // 1. Create an instance of a ticket
    const ticket = Ticket.build({
        title: 'concert lisa',
        price: 5,
        userId: '123'
    });

    // 2. Save the ticket to DB.
    await ticket.save();


    // 3. Fetch the ticket twice
    // 🔁 อ่านตั๋วใบเดิมจากฐานข้อมูล “สองรอบ” เก็บไว้เป็นสอง object: firstInstance และ secondInstance
    // เปรียบได้กับ "สองคนเปิดดูข้อมูลพร้อมกัน"
    const firstInstance = await Ticket.findById(ticket.id);
    const secondInstance = await Ticket.findById(ticket.id);


    // 4. Make two separate changes
    // ✍️ ทั้งสองคนต่างแก้ไขราคาของตัวเอง: คนแรกเปลี่ยนเป็น 10, คนที่สองเปลี่ยนเป็น 15
    firstInstance?.set({ price: 10 });
    secondInstance?.set({ price: 15 });

    // 5. Save the first fetched ticket
    // 💾 คนแรกกดบันทึกก่อน → สำเร็จ เพราะ version ยังถูกต้อง
    await firstInstance?.save();

    // 6. save the second fetched ticket and expect an error
    // ❌ คนที่สองพยายามบันทึก → ล้มเหลว เพราะ version ไม่ตรงกับฐานข้อมูลอีกแล้ว (ถูกเปลี่ยนไปตอนคนแรกบันทึก)
    try {
        await secondInstance?.save();
    } catch (error) {
        return;
    }

    throw new Error('Should not reach this point');
});


it('increments the version number on multiple save', async () => {
    const ticket = Ticket.build({
        title: 'concert lisa',
        price: 200,
        userId: '123'
    });
    await ticket.save();
    expect(ticket.version).toEqual(0);
    await ticket.save();
    expect(ticket.version).toEqual(1);
    await ticket.save();
    expect(ticket.version).toEqual(2);
});