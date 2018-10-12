import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import PointTrackerForm from '../point-tracker-form/point-tracker-form';
import * as exportActions from '../../actions/extract';
import * as routes from '../../lib/routes';

// import Navbar from '../navbar/navbar';
// import AdminUser from '../app/app';
// import Auth from '../auth/auth';

import './_admin-content.scss';

const mapStateToProps = state => ({
  myProfile: state.myProfile,
  csvExtractLink: state.csvExtractLink,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  createCsvExtract: extractCommand => dispatch(exportActions.createCsvExtract(extractCommand)),
  clearCsvExtractLink: () => dispatch(exportActions.clearCsvExtractLink()),
});
// const name = Auth(['admin']);

class AdminContent extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      show: 'nada',
      content: undefined,
      modal: false,
      exportSource: '',
      exportFrom: '',
      exportTo: '',
      waitingOnSave: false,
      csvFileSaved: false,
      csvLink: '',
      error: null,
    };
  }
  
  componentDidUpdate(prevProps) {
    if (prevProps.show !== this.props.show) {
      this.setState({ show: this.props.show, csvFileSaved: false });
    }
    if (this.props.csvExtractLink !== prevProps.csvExtractLink) {
      this.setState({
        ...this.state,
        csvFileSaved: true,
        waitingOnSave: false,
        csvLink: this.props.csvExtractLink,
        error: null,
      });
    }
    if (this.props.error !== prevProps.error) {
      this.setState({
        ...this.state,
        csvFileSaved: true,
        waitingOnSave: false,
        csvLink: '',
        error: this.props.error,
      });
    }
  }

  componentDidMount = () => {
    this.setState({ csvFileSaved: false, waitingOnSave: false });
  }

  handleChange = (e) => {
    const modal = !this.state.modal;
    this.setState({ 
      content: this.props.students.find(s => s._id.toString() === e.target.value),
      modal,
      show: 'nada',
    });
  }

  handleButtonClick = () => {
    if (this.state.modal) {
      this.setState({ modal: false, show: 'nada' });
    } else {
      this.setState({ modal: true, show: routes.POINTS_TRACKER_ROUTE });
    }
  }

  exportFormChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    switch (e.target.id) {
      case 'data-source':
        return this.setState({ exportSource: e.target.value });
      case 'from':
        return this.setState({ exportFrom: e.target.value });
      case 'to':
        return this.setState({ exportTo: e.target.value });
      default:
    }
    return undefined;
  }

  handleExtractButton = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const defaultExport = {
      exportSource: '',
      exportFrom: '',
      exportTo: '',
      waitingOnSave: false,
      csvFileSaved: false,
    };

    let extractCommand;
    switch (e.target.id) {
      case 'extract':
        extractCommand = `${this.state.exportSource}?from=${this.state.exportFrom}&to=${this.state.exportTo}`;
        this.setState({ ...this.state, waitingOnSave: true });
        this.props.createCsvExtract(extractCommand);
        break;
      case 'cancel':
        this.setState({ 
          ...this.state, 
          show: 'nada', 
          ...defaultExport, 
        });
        break;
      default:
    }
    return undefined;
  }

  render() {
    const name = this.props.myProfile ? this.props.myProfile.firstName : null;

    const pickStudentJSX = (
      <form onChange={this.handleChange}>
        <div className="field-wrap dropdown">
          <label className="title" htmlFor="student">Select student:</label>
            <select type="student" required>
              <option value="" selected="true" disabled> -- select a student -- </option>
              {
                this.props.students
                  .sort((p1, p2) => {
                    if (p1.lastName > p2.lastName) return 1;
                    if (p1.lastName < p2.lastName) return -1;
                    return 0;
                  })
                  .map((p) => {
                    return <option key={p._id} value={p._id}>
                      {p.lastName}, {p.firstName}
                    </option>;
                  })
              }
            </select>
        </div>
      </form>
    );
    
    const csvFileSavedResponseJSX = () => {
      let responseJSX;
      if (!this.state.error) {
        responseJSX = <h5>CSV Extract File URL: <a href={this.state.csvLink}>{this.state.csvLink}</a></h5>;
      } else if (this.state.error.status === 404) {
        responseJSX = <h5>No data found in the date range provided. Try a different range.</h5>;
      } else {
        responseJSX = <h5>Error saving CSV. Status: {this.error.status}, Message: {this.error.message}</h5>;
      }
      return responseJSX;
    };

    const pickExportTypeAndDateRangeJSX = (
      <form onChange={this.exportFormChange}>
        <div className="fieldwrap dropdown">
          <label className="title" htmlFor="data-source">Exported data source:</label>
          <select type="text" id="data-source"required>
            <option value="" selected="true" disabled>-- select data source -- </option> 
            <option value="pointstracker" key="pointstracker">Point Tracker Forms</option>
            <option value="studentdata" key="studentdata">Student Data</option>
          </select>
        </div>
        <div className="fieldwrap">
          <label className="title" htmlFor="from">Starting date:</label>
          <input type="date" id="from" />
        </div>
        <div className="fieldwrap">
          <label className="title" htmlFor="to">Ending date:</label>
          <input type="date" id="to" />
        </div>
        { this.state.waitingOnSave 
          ? <h5>Waiting...</h5> 
          : <button 
            className="btn btn-secondary" 
            type="submit" 
            id="extract"
            onClick={this.handleExtractButton}>
            Create CSV Extract
            </button> }
        { this.state.csvFileSaved 
          ? csvFileSavedResponseJSX()
          : null }
      </form>
    );

    return (
      <div role="main" className="col-md-8 panel">
        {this.state.show === 'nada' && !this.state.modal ? <h1>Hello { name }</h1> : null }
        {this.state.show === routes.POINTS_TRACKER_ROUTE ? pickStudentJSX : null }
        {
          this.state.modal ? <PointTrackerForm content={ this.state.content } buttonClick={ this.handleButtonClick } /> : null
        }
        {this.state.show === routes.EXTRACT_CSV_ROUTE ? pickExportTypeAndDateRangeJSX : null }
      </div>
    );
  }
}

AdminContent.propTypes = {
  myProfile: PropTypes.object,
  show: PropTypes.string,
  students: PropTypes.array,
  createCsvExtract: PropTypes.func,
  clearCsvExtractLink: PropTypes.func,
  csvExtractLink: PropTypes.string,
  error: PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(AdminContent);
