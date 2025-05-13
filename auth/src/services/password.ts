import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';


/**
 * scrypt ใช้ hash password ซึ่ง downside คือเป็นรูปแบบ callback ดังนั้นจึงต้อง promisify เพื่อจะเขียนในรูปแบบ async await
 */
const scryptAsync = promisify(scrypt);


export class Password {
    static async toHash(password: string) {
        const salt = randomBytes(8).toString('hex');
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;

        return `${buf.toString('hex')}.${salt}`;
    }

    static async compare(storedPassword: string, suppliedPassword: string) {
        const [hashedPassword, salt] = storedPassword.split('.');
        const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

        return buf.toString('hex') === hashedPassword;
    }
}