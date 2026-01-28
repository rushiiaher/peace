const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/lmsdb');

const QuestionBankSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  topic: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number
  }]
});

const CourseSchema = new mongoose.Schema({
  name: String
});

const QuestionBank = mongoose.model('QuestionBank', QuestionBankSchema);
const Course = mongoose.model('Course', CourseSchema);

async function seed() {
  const course = await Course.findOne({ name: 'Web Development' });
  
  if (!course) {
    console.log('Web Development course not found');
    process.exit(1);
  }

  const qbs = [
    { topic: 'HTML Basics', count: 50 },
    { topic: 'CSS Fundamentals', count: 50 },
    { topic: 'JavaScript Essentials', count: 50 }
  ];

  for (const qb of qbs) {
    const questions = [];
    for (let i = 1; i <= qb.count; i++) {
      questions.push({
        question: `This is test question ${i} of ${qb.topic}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: i % 4
      });
    }

    await QuestionBank.create({
      courseId: course._id,
      topic: qb.topic,
      questions
    });
    console.log(`Created ${qb.topic} with ${qb.count} questions`);
  }

  console.log('Seeding complete');
  process.exit(0);
}

seed();
