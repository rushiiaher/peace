
import mongoose from 'mongoose';
import connectDB from './lib/mongodb';
import AdmitCard from './lib/models/AdmitCard';
import Exam from './lib/models/Exam';
import Course from './lib/models/Course'; import User from './lib/models/User';

async function checkData() {
    await connectDB();

    // Find one admit card
    const card = await AdmitCard.findOne().populate({
        path: 'examId',
        select: 'type title examNumber courseId',
        populate: {
            path: 'courseId',
            select: 'name examConfigurations'
        }
    }).lean();

    if (!card) {
        console.log("No admit cards found.");
        return;
    }

    console.log("Admit Card ID:", card._id);
    console.log("Stored Duration:", card.duration);
    console.log("Exam ID:", card.examId?._id);

    if (card.examId) {
        console.log("Exam Title:", card.examId.title);
        console.log("Exam Number (on exam):", card.examId.examNumber);

        if (card.examId.courseId) {
            console.log("Course Found:", card.examId.courseId.name);
            console.log("Exam Configurations:", JSON.stringify(card.examId.courseId.examConfigurations, null, 2));
        } else {
            console.log("Course ID is missing or null on Exam object");
        }
    } else {
        console.log("Exam object is missing on Admit Card");
    }
}

checkData().then(() => process.exit()).catch(err => console.error(err));
