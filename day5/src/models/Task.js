const { Schema, model } = require('mongoose');

const attachmentSchema = new Schema(
  {
    filename: { type: String, required: true },     // stored filename on disk
    originalname: { type: String, required: true }, // original filename from user
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },         // bytes
  },
  { _id: false }
);

const taskSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200, trim: true },
    description: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    dueDate: { type: Date, default: null },          // used by reminder job
    attachments: { type: [attachmentSchema], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, title: 1 }, { unique: true });

taskSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = model('Task', taskSchema);
