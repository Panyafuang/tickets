import mongoose from "mongoose";
import { Password } from "../services/password";

// An interface that describes the properties, that are requried to create a new User
interface IUserAttrs {
    email: string;
    password: string;
}

// An interface that describes the properties, that a User Model has, Tell TS a build function available on this User model.
interface IUserModel extends mongoose.Model<IUserDoc> {
    build(attrs: IUserAttrs): IUserDoc;
}

// An interface that describes the properties, that a User Document has
interface IUserDoc extends mongoose.Document {
    email: string;
    password: string;
}


const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        }
    }, {
    toJSON: {
        /**
         * {
                "email": "่sara@gmail.com",
                "_id": "67f0f4f9235e052c42cdce28",
                "__v": 0
            }
                TO
            {
                "email": "่sara2@gmail.com",
                "id": "67f0f588ab817df9d39fec26"
            }
         * 
         * @param doc 
         * @param ret the thing tha's going to eventually be turned into JSON.
         */
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.password;
            delete ret.__v;
        }
    }
}
);

/** Before saving to DB let Encryt password */
userSchema.pre('save', async function (done) {
    if (this.isModified('password')) {
        const hashed = await Password.toHash(this.get('password'));
        this.set('password', hashed);
    }
    done();
});

/** The entire of goal of this build function was to just allow TS to do some validation on type checking on the properties we was trying to use to create a new record */
userSchema.statics.build = (attrs: IUserAttrs) => {
    return new User(attrs);
}

/**
The UserDoc represents the type that is returned when using the model to create a single document or instance (e.g. when calling User.build).
UserModel represents the type of the entire collection, or Model, that is returned when calling mongoose.model('User', userSchema).
 */
const User = mongoose.model<IUserDoc, IUserModel>('User', userSchema);


export { User };