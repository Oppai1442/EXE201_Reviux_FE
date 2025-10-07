import { departmentGetUserDataAPI } from "@/services/department/departmentService";
import { useEffect, useState } from "react";

interface DeptUserData {
  hasDepartment: boolean,
  departmentId: number,
  departmentRole: string,
  departmentJoinDate: string
}

const useMenuAccessControl = () => {
  const [userData, setUserData] = useState<DeptUserData>();

  
  const fetchInitData = async() => {
    try {
      const response = await departmentGetUserDataAPI() as DeptUserData;
      setUserData(response)
      console.log(response)
    } catch (err) {

    }
  }

  useEffect(() => {
    fetchInitData()
  }, []);

  const deptId = userData?.departmentId
  const hasDept = userData?.hasDepartment;
  const isOwner = userData?.departmentRole === 'ROLE_DEPT_HEAD';
  const isLecturer = userData?.departmentRole === 'ROLE_DEPT_LECTURER';
  const isExaminer = userData?.departmentRole === 'ROLE_DEPT_EXAMINER';
  const isUser = userData?.departmentRole === 'ROLE_DEPT_USER';

  return {
    userData,
    hasDept,
    
    deptId,

    isOwner,
    isLecturer,
    isExaminer,
    isUser,
  };
};

export default useMenuAccessControl;