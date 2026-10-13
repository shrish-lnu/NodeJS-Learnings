const { Schema, model } = require('mongoose');

const taskSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200, trim: true },
    description: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
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
