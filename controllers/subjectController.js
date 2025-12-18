import Subject from "../models/Subject.js";
import User from "../models/User.js";
import { validateSubject } from "../models/Subject.js";








/**
 * @route /api/subject
 * @method GET
 * @access protected 
 */
export const getAllSubjects = async (req, res) => {
    try{

        let subjects = await Subject.find().populate("instructor", "name");
        if(!subjects)
            return res.status(404).json({message: 'Subjects Is Not Found'})

        res.status(200).json(subjects);
    } catch(error){
        res.status(500).json({message: error.message})
    }
}


/**
 * @route /api/subject/instructor/:id
 * @method GET
 * @access protected 
 */
export const getAllSubjectsOfInstructor = async (req, res) => {
    try{
        let subjects = await Subject.find({instructor: req.params.id});
        if(!subjects)
            return res.status(404).json({message: 'Subjects Is Not Found'})

        res.status(200).json(subjects);
    } catch(error){
        res.status(500).json({message: error.message})
    }
}

/**
 * @desc add new subject
 * @route /api/subject
 * @method POST
 * @access protected 
 */
export const addSubject = async (req, res) => {
    const {error} = validateSubject(req.body)
    if(error)
        return res.status(400).json({message: error.details[0].message})

    try{

        let subject = await Subject.findOne({
            name: req.body.name,
            instructor: req.body.instructor,
            stage: req.body.stage,
            department: req.body.department
        })
        if(subject)
            return res.status(400).json({message: 'this is subject already existed'})
        
        subject = new Subject(req.body);
        await subject.save();

        res.status(201).json("subjec successfully added.");
    } catch(error){
        res.status(500).json({message: error.message})
    }
}

/**
 * @desc delete subject
 * @route /api/subject/:id
 * @method DELETE
 * @access protected 
 */
export const deleteSubject = async (req, res) => {
    try{
        //check if subject exists
        let subject = await Subject.findOne({_id: req.params.id})
        if(!subject)
            return res.status(404).json({message: 'the subject is not found.'})

        const students = await User.find({ subjects: subject._id });
        for (let student of students) {
                student.subjects = student.subjects.filter(subjId => subjId.toString() !== subject._id.toString());
                await student.save();
        }
        //delete subject
        subject = await Subject.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "the subject have been deleted successfully."})
    } catch(error){
        res.status(500).json({message: error.message})
    }
}


/**
 * @route /api/subject/assignedToAllStudents
 * @method PATCH
 * @access protected 
 */
export const StudentsAssignedToSubject = async (req, res) => {
    try {
        const subjects = await Subject.find();
        if (!subjects || subjects.length === 0)
            return res.status(400).json({ message: 'No subjects found.' });
        const students = await User.find({ role: '1' });
        for (let student of students) {
            const matchedSubjects = subjects.filter(subj =>
                subj.department === student.department &&
                subj.stage === student.stage
            );
            for (let subject of matchedSubjects) {
                if (!student.subjects.includes(subject._id)) {
                    student.subjects.push(subject._id);
                }
            }
            await student.save();
        }
        res.status(200).json({ message: 'Subjects assigned to students successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

