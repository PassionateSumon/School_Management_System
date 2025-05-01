import type { ServerRoute } from "@hapi/hapi";
import authRoutes from "./auth.route";
import permissionRoutes from "./permission.route";
import inviteRoutes from "./invite.route";
import schoolRoutes from "./school.route";
import classRoutes from "./class.route";
import classScheduleRoutes from "./classSchedule.route";
import classStudentRoutes from "./classStudent.route";
import departmentRoutes from "./departments.route";
import educationRoutes from "./education.route";
import experienceRoutes from "./experience.route";
import subjectRoutes from "./subject.route";
import roleRoutes from "./role.route";
import complaintRoutes from "./complaint.route";
import assignmentRoutes from "./assignment.route";
import degreeRoutes from "./degree.route";
import noticeBoardRoutes from "./noticeBoard.route";
import eventRoutes from "./event.route";
import examRoutes from "./exam.route";
import resultRoutes from "./result.route";

const indexRoutes: ServerRoute[] = [
  ...authRoutes,
  ...permissionRoutes,
  ...inviteRoutes,
  ...schoolRoutes,
  ...classRoutes,
  ...classScheduleRoutes,
  ...classStudentRoutes,
  ...departmentRoutes,
  ...educationRoutes,
  ...experienceRoutes,
  ...subjectRoutes,
  ...roleRoutes,
  ...complaintRoutes,
  ...assignmentRoutes,
  ...degreeRoutes,
  ...noticeBoardRoutes,
  ...eventRoutes,
  ...examRoutes,
  ...resultRoutes,
];

export { indexRoutes };
