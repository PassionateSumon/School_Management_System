import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { School } from "../models/School.model";
import { Class } from "../models/Class.model";
import { Department } from "../models/Department.model";
import { Event } from "../models/Event.model";
import { User } from "../models/User.model";
import { ClassStudent } from "../models/ClassStudent.model";
import { Op } from "sequelize";

// Create Event
export const createEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      classId,
      schoolId,
      departmentId,
      scope,
      link,
    } = req.payload as any;

    const schoolExists = await School.findByPk(schoolId);
    if (!schoolExists) {
      return error(
        { error: "Invalid school" },
        "School not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (classId && !(await Class.findByPk(classId))) {
      return error(
        { error: "Invalid class" },
        "Class not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (departmentId && !(await Department.findByPk(departmentId))) {
      return error(
        { error: "Invalid department" },
        "Department not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Validate scope and related IDs
    if (scope === "class" && !classId) {
      return error(
        { error: "Missing classId" },
        "Class ID required for class scope",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (scope === "department" && !departmentId) {
      return error(
        { error: "Missing departmentId" },
        "Department ID required for department scope",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const event = await Event.create({
      title,
      description: description || null,
      date,
      startTime,
      classId: classId || null,
      schoolId,
      departmentId: departmentId || null,
      scope,
      link: link || null,
    });

    return success(
      { event },
      "Event created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to create event",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Events
export const listEvents = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { schoolId, classId, departmentId, scope } = req.query as any;
    // console.log("controller - 97 -- ",userId, schoolId);

    const user = (await User.findByPk(userId, {
      attributes: ["schoolId", "departmentId"],
    })) as any;
    // console.log(user.schoolId, "user");
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Build where clause
    const where: any = { schoolId: user.schoolId }; // Restrict to user's school

    if (schoolId) {
      if (schoolId !== user.schoolId) {
        return error(
          { error: "Unauthorized school" },
          "Cannot access events from another school",
          statusCodes.BAD_REQUEST
        )(h);
      }
      where.schoolId = schoolId;
    }

    if (classId) {
      const classExists = await Class.findByPk(classId);
    //   console.log(classExists, "classExists");
      if (!classExists) {
        return error(
          { error: "Invalid class" },
          "Class not found",
          statusCodes.NOT_FOUND
        )(h);
      }
      where.classId = classId;
    }

    if (departmentId) {
      const departmentExists = await Department.findByPk(departmentId);
    //   console.log(departmentExists, "departmentExists");
      if (!departmentExists) {
        return error(
          { error: "Invalid department" },
          "Department not found",
          statusCodes.NOT_FOUND
        )(h);
      }
      where.departmentId = departmentId;
    }

    if (scope) {
        console.log(scope, "scope");
      where.scope = scope;
    }

    // If no specific filters (only schoolId or none), limit to user's affiliations
    if (!classId && !departmentId && !scope) {
      // Get user's classes (students via ClassStudent, teachers via Class.teacherId)
      const studentClasses = (await ClassStudent.findAll({
        where: { studentId: userId },
        attributes: ["classId"],
      })) as any;
      const teacherClasses = (await Class.findAll({
        where: { teacherId: userId },
        attributes: ["id"],
      })) as any;
      const classIds = [
        ...studentClasses.map((sc: any) => sc.classId),
        ...teacherClasses.map((tc: any) => tc.id),
      ];
      console.log(classIds, "classIds");
      console.log(where, "where");

      const departmentIds = user.departmentId ? [user.departmentId] : [];

      where[Op.or] = [
        { scope: "school" }, // School-wide events
        { classId: { [Op.in]: classIds }, scope: "class" }, // User's classes
        { departmentId: { [Op.in]: departmentIds }, scope: "department" }, // User's department
      ];
    }

    // console.log(where, "where");
    const events = await Event.findAll({
      where,
    //   include: [
    //     { model: School, attributes: ["name"], },
    //     { model: Class, attributes: ["name"], required: false },
    //     {
    //       model: Department,
    //       attributes: ["name"],
    //       required: false,
    //     },
    //   ],
    });

    return success(
      { events },
      "Events retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve events",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Event Details
export const getEventDetails = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { eventId } = req.params;
    const { schoolId, classId, departmentId, scope } = req.query as any;

    // Get user's affiliations
    const user = (await User.findByPk(userId, {
      attributes: ["schoolId", "departmentId"],
    })) as any;
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Fetch event
    const event = (await Event.findOne({
      where: { id: eventId, schoolId: user.schoolId },
    //   include: [
    //     { model: School, attributes: ["name"], as: "School" },
    //     { model: Class, attributes: ["name"], as: "Class", required: false },
    //     {
    //       model: Department,
    //       attributes: ["name"],
    //       as: "department",
    //       required: false,
    //     },
    //   ],
    })) as any;

    if (!event) {
      return error(
        { error: "Event not found" },
        "Event not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Apply query filters if provided
    if (schoolId && event.schoolId !== schoolId) {
      return error(
        { error: "Invalid school" },
        "School mismatch",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (classId && event.classId !== classId) {
      return error(
        { error: "Invalid class" },
        "Class mismatch",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (departmentId && event.departmentId !== departmentId) {
      return error(
        { error: "Invalid department" },
        "Department mismatch",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (scope && event.scope !== scope) {
      return error(
        { error: "Invalid scope" },
        "Scope mismatch",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Check visibility for non-filtered or partial queries
    if (!classId && !departmentId && !scope) {
      const studentClasses = (await ClassStudent.findAll({
        where: { studentId: userId },
        attributes: ["classId"],
      })) as any;
      const teacherClasses = (await Class.findAll({
        where: { teacherId: userId },
        attributes: ["id"],
      })) as any;
      const classIds = [
        ...studentClasses.map((sc: any) => sc.classId),
        ...teacherClasses.map((tc: any) => tc.id),
      ];
      const isVisible =
        event.scope === "school" ||
        (event.scope === "class" && classIds.includes(event.classId)) ||
        (event.scope === "department" &&
          event.departmentId === user.departmentId);
      if (!isVisible) {
        return error(
          { error: "Unauthorized" },
          "Event not visible to user",
          statusCodes.BAD_REQUEST
        )(h);
      }
    }

    return success(
      { event },
      "Event details retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve event details",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Event
export const updateEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { eventId } = req.params;
    const {
      title,
      description,
      date,
      startTime,
      classId,
      schoolId,
      departmentId,
      scope,
      link,
    } = req.payload as any;

    // Get user's schoolId
    const user = (await User.findByPk(userId, {
      attributes: ["schoolId"],
    })) as any;
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Find event
    const event = (await Event.findOne({
      where: { id: eventId, schoolId: user.schoolId },
    })) as any;
    if (!event) {
      return error(
        { error: "Event not found" },
        "Event not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Validate schoolId, classId, departmentId
    if (schoolId) {
      if (schoolId !== user.schoolId) {
        return error(
          { error: "Unauthorized school" },
          "Cannot update to another school",
          statusCodes.BAD_REQUEST
        )(h);
      }
      const schoolExists = await School.findByPk(schoolId);
      if (!schoolExists) {
        return error(
          { error: "Invalid school" },
          "School not found",
          statusCodes.NOT_FOUND
        )(h);
      }
    }
    if (classId && !(await Class.findByPk(classId))) {
      return error(
        { error: "Invalid class" },
        "Class not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (departmentId && !(await Department.findByPk(departmentId))) {
      return error(
        { error: "Invalid department" },
        "Department not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Validate scope and related IDs
    const finalScope = scope || event.scope;
    if (finalScope === "class" && !classId && !event.classId) {
      return error(
        { error: "Missing classId" },
        "Class ID required for class scope",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (finalScope === "department" && !departmentId && !event.departmentId) {
      return error(
        { error: "Missing departmentId" },
        "Department ID required for department scope",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Update event
    await event.update({
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      date: date || event.date,
      startTime: startTime || event.startTime,
      classId: classId !== undefined ? classId || null : event.classId,
      schoolId: schoolId || event.schoolId,
      departmentId:
        departmentId !== undefined ? departmentId || null : event.departmentId,
      scope: scope || event.scope,
      link: link !== undefined ? link : event.link,
    });

    return success(
      { event },
      "Event updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to update event",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Event
export const deleteEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { eventId } = req.params;

    // Get user's schoolId
    const user = (await User.findByPk(userId, {
      attributes: ["schoolId"],
    })) as any;
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Find event
    const event = (await Event.findOne({
      where: { id: eventId, schoolId: user.schoolId },
    })) as any;
    if (!event) {
      return error(
        { error: "Event not found" },
        "Event not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Delete event
    await event.destroy();

    return success({}, "Event deleted successfully", statusCodes.SUCCESS)(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to delete event",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
