import React from 'react';
import PropTypes from 'prop-types';

import './subject-column.scss';

export default function SubjectColumn(props) {
  const handleDelete = () => {
    const { subjectName, teacher } = props.subject;
    props.deleteSubject(subjectName, teacher);
  };
  
  return (
    <div className="column data">
      <label>{ props.getTeacherName(props.subject.teacher) }</label>
      <label>{ props.subject.subjectName }</label>
      {
        Object.keys(props.subject.scoring)
          .filter(keyName => keyName !== 'tutorials')
          .map((markType, i) => (
            <input
              key={ i }
              type="number"
              onChange={ props.handleSubjectChange }
              name={ `${props.subject.subjectName}-${markType}` }
              value={ props.subject.scoring[markType] === null ? '' : props.subject.scoring[markType]}
            />
          ))
      }
      <input
        type="number"
        onChange={ props.handleSubjectChange }
        name={ `${props.subject.subjectName}-grade` }
        value={ props.subject.grade }
      />
      <button type="button" onClick={ handleDelete }>x</button>
    </div>
  );
}

SubjectColumn.propTypes = {
  subject: PropTypes.object,
  handleSubjectChange: PropTypes.func,
  getTeacherName: PropTypes.func,
  deleteSubject: PropTypes.func,
};
