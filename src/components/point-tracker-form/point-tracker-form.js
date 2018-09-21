import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getNextFridayDateString } from '../../lib/utils';
import PointTrackerTable from '../point-tracker-table/point-tracker-table';
import SynopsisReport from '../synopsis-report/synopsis-report';
import * as pointTrackerActions from '../../actions/point-tracker';
import './point-tracker-form.scss';

const emptyPointTracker = {
  _id: '',
  date: getNextFridayDateString(Date.now()),
  student: '',
  studentName: '',
  subjects: [{
    subjectName: 'Tutorial',
    teacher: '',
    scoring: {
      excusedDays: '',
      stamps: '',
      halfStamps: '',
      tutorials: '',
    },
    grade: '',
  }],
  surveyQuestions: {
    mentorAttendedCheckin: false,
    metFaceToFace: false,
    hadOtherCommunication: false,
    hadNoCommunication: false,
    scoreSheetTurnedIn: false,
    scoreSheetLostOrIncomplete: false,
    scoreSheetWillBeLate: false,
    scoreSheetOther: false,
    scoreSheetOtherReason: '',
    synopsisInformationComplete: false,
    synopsisInformationIncomplete: false,
    synopsisCompletedByRaStaff: false,
  },
  earnedPlayingTime: '',
  mentorGrantedPlayingTime: '',
  synopsisComments: {
    mentorGrantedPlayingTimeComments: '',
    studentActionItems: '',
    sportsUpdate: '',
    additionalComments: '',
  },
};

const names = {
  mentorAttendedCheckin: 'Mentor Attended Checkin',
  metFaceToFace: 'Met Face-to-Face',
  hadOtherCommunication: 'Had Other Communication',
  hadNoCommunication: 'Had No Communication',
  scoreSheetTurnedIn: 'Score Sheet Turned In',
  scoreSheetLostOrIncomplete: 'Score Sheet Lost or Incomplete',
  scoreSheetWillBeLate: 'Score Sheet will be Late',
  scoreSheetOther: 'Score Sheet Other',
  synopsisInformationComplete: 'Synopsis Information Complete',
  synopsisInformationIncomplete: 'Synopsis Information Incomplete',
  synopsisCompletedByRaStaff: 'Synopsis Completed by RA Staff',
  mentorGrantedPlayingTimeComments: 'Mentor Granted Playing Time Explanation',
  studentActionItems: 'Student Action Items',
  sportsUpdate: 'Sports Update',
  additionalComments: 'Additional Comments',
};

class PointTrackerForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = emptyPointTracker;
  }

  handleDateChange = (event) => {
    const { value } = event.target;
    const [year, month, day] = value.split('-'); 
    const date = new Date(
      parseInt(year, 10), 
      parseInt(month, 10) - 1, 
      parseInt(day, 10),
    );
    
    this.setState((prevState) => {
      const newState = { ...prevState };
      newState.date = date.getTime();
      newState.title = `Point Tracker for ${newState.studentName} for Friday ${getNextFridayDateString(value)}`;
      return newState;
    });
  }

  handleSubjectChange = (event) => {
    const validGrades = ['A', 'B', 'C', 'D', 'F', ''];

    const { name } = event.target;
    
    this.setState((prevState) => {
      const newState = { ...prevState };
      const [subjectName, categoryName] = name.split('-');

      const newSubjects = newState.subjects
        .map((subject) => {
          if (subject.subjectName === subjectName) {
            const newSubject = { ...subject };
            if (categoryName === 'grade') {
              newSubject.grade = validGrades.includes(event.target.value) ? event.target.value : '';
            } else {
              newSubject.scoring[categoryName] = Math.min(Math.max(parseInt(event.target.value, 10), 0), 8);
            }
           
            return newSubject;
          }
          return subject;
        });

      newState.subjects = newSubjects;
      return newState;
    });
  }

  handleSurveyQuestionChange = (event) => {
    const { name, checked } = event.target;

    this.setState((prevState) => {
      const newState = { ...prevState };
      newState.surveyQuestions[name] = checked;
      return newState;
    });
  }

  handlePlayingTimeChange = (event) => {
    this.setState({ ...this.state, mentorGrantedPlayingTime: event.target.value });
  }

  handleSynopsisCommentChange = (event) => {
    const { name, value } = event.target;

    this.setState((prevState) => {
      const newState = { ...prevState };
      newState.synopsisComments[name] = value;
      return newState;
    });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const pointTracker = this.state;
    delete pointTracker._id;

    this.props.createPointTracker(pointTracker);
    this.props.createSynopsisReport(pointTracker);

    this.setState({ pointTracker: emptyPointTracker });
  }

  getTeacherName = (teacherId) => {
    return this.props.teachers
      .filter(teacher => teacher._id === teacherId)
      .map(teacher => `${teacher.firstName} ${teacher.lastName}`)[0] || '';
  }

  deleteSubject = (subjectName, teacherId) => {
    this.setState((prevState) => {
      const newState = { ...prevState };

      newState.subjects = newState.subjects.filter((subject) => {
        if (subjectName && teacherId) {
          return subject.subjectName !== subjectName && subject.teacher !== teacherId;
        }
        return subject.subjectName !== subjectName;
      });

      return newState;
    });
  }

  createSubject = (subjectName, teacherId) => {
    this.setState((prevState) => {
      const newState = { ...prevState };
      const newSubject = {
        subjectName,
        teacher: teacherId,
        scoring: {
          excusedDays: null,
          stamps: null,
          halfStamps: null,
          tutorials: null,
        },
        grade: null,
      };

      newState.subjects.push(newSubject);

      return newState;
    });
  }

  handleStudentSelect = (event) => {
    event.preventDefault();
    const studentId = event.target.value;
    const selectedStudent = this.props.students.filter(student => student._id === studentId)[0];
    const { lastPointTracker } = selectedStudent.studentData;

    this.setState((prevState) => {
      let newState = { ...prevState };
      newState = lastPointTracker || emptyPointTracker;
      newState.student = studentId;
      newState.studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
      return newState;
    });
  }

  calcPlayingTime = () => {
    const { subjects } = this.state;
    const totalClassScores = subjects.map((subject) => {
      const { grade, subjectName } = subject;
      const { excusedDays, stamps, halfStamps } = subject.scoring;
      const pointsEarned = 2 * stamps + halfStamps;
      const pointsPossible = subjectName.toLowerCase === 'tutorial' ? 10 - excusedDays * 2 : 40 - excusedDays * 8;
      const pointPercentage = pointsEarned / pointsPossible;
      
      let pointScore = 0;
      if (pointPercentage >= 0.50) pointScore = 1;
      if (pointPercentage >= 0.75) pointScore = 2;

      let gradeScore = 0;
      if (['A', 'B'].includes(grade)) gradeScore = 2;
      if (grade === 'C') gradeScore = 1;

      if (subjectName.toLowerCase() === 'tutorial') gradeScore = 0;
      const totalClassScore = pointScore + gradeScore;
      return totalClassScore;
    });
    
    const totalClassScoreSum = totalClassScores.reduce((acc, cur) => acc + cur, 0);
    let earnedPlayingTime = 'None of game';
    if (totalClassScoreSum >= 30) earnedPlayingTime = 'Entire game';
    if (totalClassScoreSum >= 29) earnedPlayingTime = 'All but start';
    if (totalClassScoreSum >= 25) earnedPlayingTime = 'Three quarters';
    if (totalClassScoreSum >= 21) earnedPlayingTime = 'Two quarters';
    if (totalClassScoreSum >= 16) earnedPlayingTime = 'One quarter';
    if (earnedPlayingTime !== this.state.earnedPlayingTime) this.setState({ ...this.state, earnedPlayingTime });
    return earnedPlayingTime;
  }

  render() {
    const selectOptionsJSX = (
      <section>
        <div className="select-student">
        <label htmlFor="">Select Student</label>
          <select 
            required 
            onChange={ this.handleStudentSelect } 
            defaultValue="">
          <option disabled value="">Select Student</option>
          { this.props.students.map(student => (
              <option 
                placeholder="Select" 
                key={ student._id } 
                value={ student._id }
              >{ `${student.firstName} ${student.lastName}`}
              </option>
          ))}
          </select>
        </div>
        <div className="select-date">
          <label htmlFor="">Select Date (forced to next the Friday)</label>
          <input
            name="date"
            type="date"
            onChange={ this.handleDateChange }
            value={ getNextFridayDateString(this.state.date) }
            required
            />
        </div>
        <div className="clearfix"></div>
      </section>
    );

    const surveyQuestionsJSX = (
      <fieldset>
        <div className="survey-questions">
        {Object.keys(this.state.surveyQuestions)
          .filter(keyName => names[keyName])
          .map((surveyQuestion, i) => (
            <div className="survey-question-container" key={ i }>
              <input
                type="checkbox"
                name={ surveyQuestion }
                onChange= { this.handleSurveyQuestionChange }
                checked={ this.state.surveyQuestions.surveyQuestion }/>
              <label htmlFor={ surveyQuestion }>{ names[surveyQuestion] }</label>
            </div>
          ))}
        </div>
    </fieldset>
    );
    
    const synopsisCommentsJSX = (
      <div className="synopsis">
        <h4>Synopsis</h4>
        <p>Playing Time Earned: { this.calcPlayingTime() }</p>

        <label htmlFor="mentorGrantedPlayingTime">Mentor Granted Playing Time:</label>
        <select
          name="mentorGrantedPlayingTime"
          onChange={ this.handlePlayingTimeChange }
          value={ this.state.mentorGrantedPlayingTime }
          required
          >
          <option value="" defaultValue>Select Playing Time</option>
          <option value="Entire game">Entire Game</option>
          <option value="All but start">All but start</option>
          <option value="Three quarters">Three quarters</option>
          <option value="Two quarters">Two quarters</option>
          <option value="One quarter">One quarter</option>
          <option value="None of game">None of game</option>
        </select>

        { 
          Object.keys(this.state.synopsisComments)
            .filter(keyName => names[keyName])
            .map((synopsisComment, i) => {
              console.log(' picking comments', synopsisComment, this.state.earnedPlayingTime, this.state.mentorGrantedPlayingTime);
              if (synopsisComment === 'mentorGrantedPlayingTimeComments') {
                if (this.state.mentorGrantedPlayingTime === '' // '' => none selected
                  || this.state.mentorGrantedPlayingTime === this.state.earnedPlayingTime) {
                  return null;
                }
              } 
              return (
                <div key={ i }>
                  <label htmlFor={ synopsisComment }>{ names[synopsisComment] }</label>
                  <textarea
                    name={ synopsisComment }
                    onChange={ this.handleSynopsisCommentChange }
                    value={ this.state.synopsisComments[synopsisComment] }
                    rows="6"
                    cols="80"
                    wrap="hard"
                    placeholder={ names[synopsisComment] }
                  />
                </div>
              );
            })
        }
      </div>
    );

    return (
      <div className="points-tracker">
        <form className="data-entry" onSubmit={ this.handleSubmit }>
          <h2>POINT TRACKER TABLE</h2>
            { selectOptionsJSX }
            { surveyQuestionsJSX }
              <PointTrackerTable
                handleSubjectChange={ this.handleSubjectChange }
                subjects={ this.state.subjects }
                getTeacherName={ this.getTeacherName }
                teachers={ this.props.teachers }
                deleteSubject= { this.deleteSubject }
                createSubject={ this.createSubject }
            />
            { synopsisCommentsJSX }
            <SynopsisReport pointTracker={ this.state }/>
          <button className="submit-report" type="submit">Submit Point Tracker</button>
        </form>


      </div>
    );
  }
}

const mapStateToProps = state => ({
  students: state.students,
  teachers: state.teachers,
});

const mapDispatchToProps = dispatch => ({
  createPointTracker: pointTracker => dispatch(pointTrackerActions.createPointTracker(pointTracker)),
  createSynopsisReport: pointTracker => dispatch(pointTrackerActions.createSynopsisReport(pointTracker)),
});

PointTrackerForm.propTypes = {
  students: PropTypes.array,
  teachers: PropTypes.array,
  handleChange: PropTypes.func,
  createPointTracker: PropTypes.func,
  createSynopsisReport: PropTypes.func,
  fetchStudents: PropTypes.func,
  fetchTeachers: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(PointTrackerForm);

/*
const pointTrackerHTML = `
  <style>
    img{  
    width: 200px;
  }
  .image{  
    padding-left:20px;
    padding-top: 10px;
    padding-bottom:12px;
    height: 20px;
    background: #1f1f1f;
    width: 500px;
    border-radius: 30px;
  }
  body {
    padding: 20px;
    margin: 20px;
    border-radius: 30px;
    border: 2px solid #e8e8e8;
  
  }
  h1, h2, h3 {
    font-style:bold;
    font-family: "Raleway", Helvetica;
    color:#089444;
  }
  p {
    font-family: "Raleway", Helvetica;
    color:#1186B4;
  }
  </style>
  <body>
    <div class=image>
      <img style="-webkit-user-select: none;" src="http://portal.rainierathletes.org/2dbb0b1d137e14479018b5023d904dec.png"> 
    </div> 
  <body>
  <table></table>
    <h1>${pointTracker.studentName}</h1>
    <h3>Playing Time Earned</h3>
    <p>${pointTracker.synopsisComments.mentorGrantedPlayingTime}</p>
    <h3>Extra Playing Time Earned</h3>      
    <p>${pointTracker.synopsisComments.extraPlayingTime}</p>
    <h3>Student Action Items</h3>      
    <p>${pointTracker.synopsisComments.studentActionItems}</p>
    <h3>Sports Update</h3>      
    <p>${pointTracker.synopsisComments.sportsUpdate}</p>
    <h3>Additional Comments</h3>      
    <p>${pointTracker.synopsisComments.additionalComments}</p>
    <br>
    <br>
    <p>Sincerely,<br>${myProfile.firstName} ${myProfile.lastName}</p>
    <p>${pointTracker.subjects}</p>      
  </body>
  <script>
    var table = document.createElement('table');
    for (var i = 0; i < 4; i++){
        var tr = document.createElement('tr');   
    
        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
    
        var text1 = document.createTextNode('${pointTracker.subjects[0].subjectName}');
        var text2 = document.createTextNode('Text2');
    
        td1.appendChild(text1);
        td2.appendChild(text2);
        tr.appendChild(td1);
        tr.appendChild(td2);
    
        table.appendChild(tr);
    }
    document.body.appendChild(table);
  </script>
  `;
  */
