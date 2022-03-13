import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import {
    Row,
    Col,
    message,
    Button,
    Tag,
    Collapse,
    List,
    Modal,
    Spin,
    Typography,
    Breadcrumb,
    Space,
} from "antd";
import Link from "next/link";
import {useRouter} from "next/router";
import {useQuery, useMutation, useLazyQuery} from "@apollo/react-hooks";
import {
    GET_LICENSE,
    GET_PERSON,
    GET_PRODUCT_INFO_BY_ID,
    GET_TASK_BY_ID,
    GET_TASKS_BY_PRODUCT_SHORT,
} from "../../../../graphql/queries";
import {TASK_TYPES, USER_ROLES} from "../../../../graphql/types";
import {
    ACCEPT_AGREEMENT,
    CLAIM_TASK,
    DELETE_TASK,
    IN_REVIEW_TASK,
    LEAVE_TASK,
    REJECT_TASK,
    APPROVE_TASK,
} from "../../../../graphql/mutations";
import {getProp} from "../../../../utilities/filters";
import {EditIcon} from "../../../../components";
import DeleteModal from "../../../../components/Products/DeleteModal";
import LeftPanelContainer from "../../../../components/HOC/withLeftPanel";
import Attachments from "../../../../components/Attachments";
import CustomModal from "../../../../components/Products/CustomModal";
import Priorities from "../../../../components/Priorities";
import Loading from "../../../../components/Loading";
import parse from "html-react-parser";
import {getUserRole, hasManagerRoots} from "../../../../utilities/utils";
import AddTaskContainer from "../../../../components/Products/AddTask";
import Comments from "../../../../components/Comments";
import CustomAvatar2 from "../../../../components/CustomAvatar2";
import {UserState} from "../../../../lib/reducers/user.reducer";
import {userLogInAction} from "../../../../lib/actions";
import showUnAuthModal from "../../../../components/UnAuthModal";
import VideoPlayer from "../../../../components/VideoPlayer";
import Head from "next/head";
import ToReviewModal from "../../../../components/Products/ToReviewModal";
import {UploadFile} from "antd/es/upload/interface";
import DeliveryMessageModal from "../../../../components/Products/DeliveryMessageModal";

const {Panel} = Collapse;

const actionName = "Claim the task";

type Params = {
    user?: any;
    currentProduct: any;
    loginUrl: string;
    registerUrl: string;
    userLogInAction: Function
};

const Task: React.FunctionComponent<Params> = ({
                                                   user,
                                                   userLogInAction,
                                                   loginUrl,
                                                    registerUrl
                                               }) => {
    const router = useRouter();
    const {publishedId, personSlug, productSlug} = router.query;

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [files, setFiles] = useState([]);
    const [deliveryMessage, setDeliveryMessage] = useState('');
    const [deliveryModal, setDeliveryModal] = useState(false);

    const [agreementModalVisible, setAgreementModalVisible] = useState(false);
    const [deleteModal, showDeleteModal] = useState(false);
    const [leaveTaskModal, showLeaveTaskModal] = useState(false);
    const [reviewTaskModal, showReviewTaskModal] = useState(false);
    const [rejectTaskModal, showRejectTaskModal] = useState(false);
    const [approveTaskModal, showApproveTaskModal] = useState(false);
    const [task, setTask] = useState<any>({});
    const [taskId, setTaskId] = useState(0);
    const [showEditModal, setShowEditModal] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [license, setLicense] = useState("");

    const [isContributionGuideVisible, setIsContributionGuideVisible] = useState(false);
    const showCotributionGuide = () => {
        setIsContributionGuideVisible(true);
    };
    
    const handleContributionGuideOk = () => {
        setIsContributionGuideVisible(false);
      };
    
    const handleContributionGuideCancel = () => {
        setIsContributionGuideVisible(false);
    };

    const [getPersonData, {data: personData}] = useLazyQuery(GET_PERSON, {
        fetchPolicy: "no-cache",
        enabled: false,
        manual: true,
    });

    const {data: original, error, loading, refetch} = useQuery(GET_TASK_BY_ID, {
        fetchPolicy: "no-cache",
        variables: {publishedId, productSlug},
    });

    const {data: tasksData} = useQuery(GET_TASKS_BY_PRODUCT_SHORT, {
        variables: {
            productSlug,
            input: {},
        },
    });

    const userHasManagerRoots = hasManagerRoots(
        getUserRole(user.roles, productSlug)
    );

    let {data: product} = useQuery(GET_PRODUCT_INFO_BY_ID, {
        variables: {slug: productSlug},
    });
    product = product?.product || {};

    useEffect(() => {
        if (tasksData && tasksData.tasklistingByProduct) {
            setTasks(tasksData.tasklistingByProduct);
        }
    }, [tasksData]);

    useEffect(() => {
        if (!error) {
            setTaskId(getProp(original, "task.id", 0));
        }
    }, [original]);

    const getBasePath = () => {
        return `/${personSlug}/${productSlug}`;
    };

    const [deleteTask] = useMutation(DELETE_TASK, {
        variables: {
            id: taskId,
        },
        onCompleted() {
            message.success("Item is successfully deleted!").then();
            router.push(getBasePath() === "" ? "/" : `${getBasePath()}/tasks`).then();
        },
        onError() {
            message.error("Failed to delete item!").then();
        },
    });

    const handleIAgree = () => {
        acceptAgreement().then();
        setAgreementModalVisible(false);
    };

    const [leaveTask, {loading: leaveTaskLoading}] = useMutation(LEAVE_TASK, {
        variables: {taskId},
        onCompleted(data) {
            const {leaveTask} = data;
            const responseMessage = leaveTask.message;
            if (leaveTask.success) {
                message.success(responseMessage).then();
                fetchData().then();
                showLeaveTaskModal(false);
                getPersonData();
            } else {
                message.error(responseMessage).then();
            }
        },
        onError() {
            message.error("Failed to leave a task!").then();
        },
    });

    const [submitTask, {loading: submitTaskLoading}] = useMutation(
        IN_REVIEW_TASK,
        {
            variables: {taskId, fileList: files, deliveryMessage},
            onCompleted(data) {
                const {inReviewTask} = data;
                const responseMessage = inReviewTask.message;
                if (inReviewTask.success) {
                    message.success(responseMessage).then();
                    fetchData().then();
                    getPersonData();
                    showReviewTaskModal(false);
                } else {
                    message.error(responseMessage).then();
                }
            },
            onError() {
                message.error("Failed to submit the task in review!").then();
            },
        }
    );

    const [rejectTask, {loading: rejectTaskLoading}] = useMutation(
        REJECT_TASK,
        {
            variables: {taskId},
            onCompleted(data) {
                const {rejectTask} = data;
                const responseMessage = rejectTask.message;
                if (rejectTask.success) {
                    message.success(responseMessage).then();
                    fetchData().then();
                    showRejectTaskModal(false);
                    setDeliveryModal(false);
                    getPersonData();
                } else {
                    message.error(responseMessage).then();
                }
            },
            onError() {
                message.error("Failed to reject a work!").then();
            },
        }
    );

    const [approveTask, {loading: approveTaskLoading}] = useMutation(
        APPROVE_TASK,
        {
            variables: {taskId},
            onCompleted(data) {
                const {approveTask} = data;
                const responseMessage = approveTask.message;
                if (approveTask.success) {
                    message.success(responseMessage).then();
                    fetchData().then();
                    showApproveTaskModal(false);
                    setDeliveryModal(false);
                    getPersonData();
                } else {
                    message.error(responseMessage).then();
                }
            },
            onError() {
                message.error("Failed to approve a work!").then();
            },
        }
    );

    const [acceptAgreement] = useMutation(ACCEPT_AGREEMENT, {
        variables: {productSlug},
        onCompleted(data) {
            const messageText = getProp(data, "agreeLicense.message", "");
            const status = getProp(data, "agreeLicense.status", false);

            if (messageText !== "") {
                if (status) {
                    message.success(messageText).then();
                    claimTaskEvent();
                } else {
                    message.error(messageText).then();
                }
            }
        },
        onError() {
            message.error("Failed to accept agreement").then();
        },
    });

    const {data: licenseOriginal, error: licenseError} = useQuery(GET_LICENSE, {
        variables: {productSlug},
    });

    useEffect(() => {
        if (!licenseError) {
            setLicense(getProp(licenseOriginal, "license.agreementContent", ""));
        }
    }, [licenseOriginal]);

    const [claimTask, {loading: claimTaskLoading}] = useMutation(CLAIM_TASK, {
        variables: {taskId},
        onCompleted(data) {
            const {claimTask} = data;
            const responseMessage = claimTask.message;

            if (claimTask.isNeedAgreement) {
                setAgreementModalVisible(true);
                message.info(responseMessage).then();
            } else {
                if (claimTask.success) {
                    message.success(responseMessage).then();
                    fetchData().then();
                    getPersonData();
                } else {
                    message
                        .error(
                            claimTask.claimedTaskName ? (
                                <div>
                                    You already claimed another task on this product:
                                    <div
                                        className="pointer"
                                        style={{color: "#1890ff"}}
                                        onClick={() => {
                                            router.push(claimTask.claimedTaskLink);
                                            message.destroy();
                                        }}
                                    >
                                        {claimTask.claimedTaskName}
                                    </div>
                                    Please complete this task before claiming a new one.
                                </div>
                            ) : (
                                responseMessage
                            ),
                            5
                        )
                        .then();
                }
            }
        },
        onError({graphQLErrors, networkError}) {
            if (graphQLErrors && graphQLErrors.length > 0) {
                let msg = graphQLErrors[0].message;
                if (
                    msg === "The person is undefined, please login to perform this action"
                ) {
                    showUnAuthModal(actionName, loginUrl, registerUrl);
                } else {
                    message.error(msg).then();
                }
            }
            //@ts-ignore
            if (networkError && networkError.length > 0) {
                //@ts-ignore
                message.error(networkError[0].message).then();
            }
        },
    });

    const claimTaskEvent = () => {
        let userId = user.id;
        if (userId === undefined || userId === null) {
            showUnAuthModal(actionName, loginUrl, registerUrl);
            return;
        }

        claimTask().then();
    };

    const getCausedBy = (assignedTo: any) => {
        let status = TASK_TYPES[getProp(task, "status")];

        switch (status) {
            case "Claimed":
                return assignedTo ? status : "Proposed By";
            default:
                return status;
        }
    };

    const fetchData = async () => {
        const data: any = await refetch();

        if (data && !data.errors) {
            setTask(data.data.task);
        }
    };

    useEffect(() => {
        if (personData && personData.person) {
            const {
                firstName,
                slug,
                id,
                username,
                productpersonSet,
                claimedTask,
            } = personData.person;
            userLogInAction({
                isLoggedIn: true,
                loading: false,
                firstName,
                slug,
                id,
                claimedTask,
                username: username,
                roles: productpersonSet.map((role: any) => {
                    return {
                        product: role.product.slug,
                        role: USER_ROLES[role.right],
                    };
                }),
            });
        } else if (personData && personData.person === null) {
            userLogInAction({
                isLoggedIn: false,
                loading: false,
                firstName: "",
                slug: "",
                username: "",
                id: null,
                claimedTask: null,
                roles: [],
            });
        }
    }, [personData]);

    useEffect(() => {
        if (original) {
            setTask(getProp(original, "task", {}));
        }
    }, [original]);

    if (loading) return <Loading/>;

    const showAssignedUser = () => {
        const assignee = getProp(task, "assignedTo", null);
        return (
            <Row className="text-sm mb-10">
                {assignee ? (
                    <>
                        {assignee.id === user.id ? (
                            <div className="flex-column">
                                <strong className="my-auto">Claimed by you</strong>
                            </div>
                        ) : (
                            <Row style={{marginTop: 10}} className="text-sm mt-8">
                                <strong className="my-auto">Claimed by: </strong>
                                <Row align="middle" style={{marginLeft: 15}}>
                                    <Col>
                                        <CustomAvatar2 person={{firstName: getProp(assignee, "firstName", ""),slug: getProp(assignee, "slug", "")}}/>
                                    </Col>
                                    <Col>
                                        <Typography.Link
                                            className="text-grey-9"
                                            href={`/${getProp(assignee, "slug", "")}`}
                                        >
                                            {getProp(assignee, "firstName", "")}
                                        </Typography.Link>
                                    </Col>
                                </Row>
                            </Row>
                        )}
                    </>
                ) : null}
            </Row>
        );
    };

    const assignedTo = getProp(task, "assignedTo");
    const tags = getProp(task, "tag", []);

    const showTaskEvents = () => {
            const assignee = getProp(task, "assignedTo", null);
            const taskStatus = TASK_TYPES[getProp(task, "status")];
            const inReview = getProp(task, "inReview", false);
            const contributionGuide = getProp(task, "contributionGuide", "");

            return (
                <Row className="text-sm">
                    {assignee && !inReview ? (
                        <>
                            {assignee.id === user.id && taskStatus === "Claimed" ? (
                                <div className="flex-column ml-auto mt-10">
                                    <Button
                                        type="primary"
                                        className="mb-10"
                                        onClick={() => showReviewTaskModal(true)}
                                    >
                                        Submit for review
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={() => showLeaveTaskModal(true)}
                                        style={{zIndex: 1000}}
                                    >
                                        Leave the task
                                    </Button>
                                </div>
                            ) : null}
                        </>
                    ) : null}
                    {taskStatus === "Available" && (
                        <>
                            <div className="flex-column ml-auto mt-10">
                                <Button type="primary" onClick={() => claimTaskEvent()}>
                                    Claim the task
                                </Button>
                                {contributionGuide && (
                                <>
                                    <a style={{textAlign: 'center', marginTop: '5px', fontSize: '13px'}} 
                                    href='#' onClick={() => showCotributionGuide()}>Contribution guide</a>

                                    <Modal 
                                        title="Contribution Guide" 
                                        visible={isContributionGuideVisible} 
                                        onOk={handleContributionGuideOk} 
                                        onCancel={handleContributionGuideCancel}
                                        footer={[
                                            <Button key="submit" type="primary" onClick={handleContributionGuideOk}>
                                            Ok
                                            </Button>,
                                        ]}
                                    >
                                        {parse(contributionGuide.description)}                                
                                    </Modal>
                                </>
                                )}

                            </div>
                        </>
                    )}
                </Row>
            );
        }
    ;

    let status = TASK_TYPES[getProp(task, "status")];
    const initiativeName = getProp(task, "initiative.name", undefined);
    const inReview = getProp(task, "inReview", false);

    if (inReview && status !== "Done") status = "In Review";

    const showInReviewEvents = () => {
            return (
                <Row className="text-sm">
                    <div className=" mt-5">
                        <Button
                            type="primary"
                            className="mb-10"
                            style={{zIndex: 1000}}
                            onClick={() => showApproveTaskModal(true)}
                        >
                            Approve the work
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => showRejectTaskModal(true)}
                            style={{zIndex: 1000}}
                        >
                            Reject the work
                        </Button>
                        <div style={{marginLeft: 67, textAlign: "left", fontSize: 14, marginTop: 9}} className="mb-10">The
                            task is submitted for
                            review.<br/> See <div
                                onClick={() => {
                                    setDeliveryModal(true);
                                }} style={{
                                display: "inline-block",
                                color: "#188ffe",
                                textDecorationLine: "underline"
                            }}>Delivery Message</div></div>
                    </div>
                </Row>
            );
        }
    ;
    const videoLink = getProp(task, "previewVideoUrl", null);

    return (
        <>
            <Head>
                <title> {getProp(task, "title", "")} </title>
                {/* `${getProp(task, "title", "")} - ${ getProp(product, "name", "")}` => "Task title - Product name" */}
                <meta name="description" content={`${getProp(task, "title", "")} - ${getProp(product, "name", "")}`}/>
            </Head>
            <LeftPanelContainer>
                <Spin
                    tip="Loading..."
                    spinning={
                        loading || leaveTaskLoading || claimTaskLoading || submitTaskLoading
                    }
                    delay={200}
                >
                    {!error && (
                        <>
                            {getBasePath() !== "" && (
                                <Breadcrumb>
                                    <Breadcrumb.Item>
                                        <a href={getBasePath()}>{getProp(product, "name", "")}</a>
                                    </Breadcrumb.Item>
                                    <Breadcrumb.Item>
                                        <a href={`${getBasePath()}/tasks`}>Tasks</a>
                                    </Breadcrumb.Item>
                                    {initiativeName && (
                                        <Breadcrumb.Item>
                                            <a
                                                href={`/${getProp(product, "owner", "")}/${getProp(
                                                    product,
                                                    "slug",
                                                    ""
                                                )}/initiatives/${getProp(task, "initiative.id", "")}`}
                                            >
                                                {initiativeName}
                                            </a>
                                        </Breadcrumb.Item>
                                    )}
                                    <Breadcrumb.Item>
                                        {getProp(original, "task.title", "")}
                                    </Breadcrumb.Item>
                                </Breadcrumb>
                            )}
                            <Row
                                justify="space-between"
                                className="right-panel-headline strong-height"
                            >
                                <Col md={16}>
                                    <div className="section-title">
                                        {getProp(task, "title", "")}
                                    </div>
                                </Col>
                                <Col md={8} className="text-right">
                                    {userHasManagerRoots && (
                                        <>
                                            <Col>
                                                <Button onClick={() => showDeleteModal(true)}>
                                                    Delete
                                                </Button>
                                                <EditIcon
                                                    className="ml-15"
                                                    onClick={() => setShowEditModal(true)}
                                                />
                                                {status === "In Review" && showInReviewEvents()}
                                            </Col>
                                        </>
                                    )}
                                    {showTaskEvents()}
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Row className="html-description">
                                        <Col
                                            style={{
                                                overflowX: "auto",
                                                width: "calc(100vw - 95px)",
                                                marginTop: status === "In Review" ? 100 : 50,
                                            }}
                                        >
                                            {videoLink && (
                                                <div className="pb-15">
                                                    <VideoPlayer videoLink={videoLink}/>
                                                </div>
                                            )}
                                            {parse(getProp(task, "description", ""))}
                                        </Col>
                                    </Row>

                                    <div className="mt-22">
                                        {getProp(task, "taskCategory", null) && (
                                            <Row style={{marginTop: 10}} className="text-sm mt-8">
                                                <strong className="my-auto">Required skills:</strong>&nbsp;
                                                <Col className="expertises expertises-task">
                                                    {getProp(task, "taskCategory", null)}
                                                    {getProp(task, "taskExpertise", null) && (
                                                        getProp(task, "taskExpertise", null).map((exp, index) => 
                                                            <>{index > 0?', ':' ('}{exp.name}</>
                                                        )
                                                    )}
                                                    {getProp(task, "taskExpertise", null) && (<>)</>)}
                                                </Col>
                                                
                                            </Row>
                                        )}

                                        {showAssignedUser()}
                                        
                                        <Row style={{marginTop: 10}} className="text-sm mt-8">
                                            <strong className="my-auto">Created By: </strong>

                                            <Row align="middle" style={{marginLeft: 15}}>
                                                <Col>
                                                    <CustomAvatar2
                                                        person={{
                                                            firstName: getProp(task, "createdBy.firstName", ""),
                                                            slug: getProp(task, "createdBy.slug", ""),
                                                        }}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Typography.Link
                                                        className="text-grey-9"
                                                        href={`/${getProp(task, "createdBy.slug", "")}`}
                                                    >
                                                        {getProp(task, "createdBy.firstName", "")}
                                                    </Typography.Link>
                                                </Col>
                                            </Row>
                                        </Row>

                                        <Row className="text-sm mt-8">
                                            {[
                                                "Available",
                                                "Draft",
                                                "Pending",
                                                "Blocked",
                                                "In Review",
                                            ].includes(status) ? (
                                                <strong className="my-auto">Status: {status}</strong>
                                            ) : (
                                                <>
                                                    <strong className="my-auto">
                                                        Status: {getCausedBy(assignedTo)}
                                                    </strong>
                                                    <div className="ml-5">
                                                        {getProp(task, "createdBy", null) !== null &&
                                                        !assignedTo ? (
                                                            <Row>
                                                                <Col>
                                                                    <CustomAvatar2
                                                                        person={{
                                                                            firstName: getProp(
                                                                                task,
                                                                                "createdBy.firstName",
                                                                                ""
                                                                            ),
                                                                            slug: getProp(task, "createdBy.slug", ""),
                                                                        }}
                                                                    />
                                                                </Col>
                                                                <div className="my-auto">
                                                                    {getProp(
                                                                        getProp(task, "createdBy"),
                                                                        "firstName",
                                                                        ""
                                                                    )}
                                                                </div>
                                                            </Row>
                                                        ) : null}
                                                    </div>
                                                </>
                                            )}
                                        </Row>
                                        {getProp(task, "priority", null) && (
                                            <Row style={{marginTop: 10}} className="text-sm mt-8">
                                                <strong className="my-auto">Priority:&nbsp;</strong>
                                                &nbsp;
                                                <Priorities
                                                    task={task}
                                                    submit={() => refetch()}
                                                    canEdit={userHasManagerRoots}
                                                />
                                            </Row>
                                        )}
                                        {getProp(task, "reviewer.slug", null) && (
                                            <Row style={{marginTop: 10}} className="text-sm mt-8">
                                                <strong className="my-auto">Reviewer:</strong>

                                                <Row align="middle" style={{marginLeft: 15}}>
                                                    <Col>
                                                        <CustomAvatar2
                                                            person={{
                                                                firstName: getProp(
                                                                    task,
                                                                    "reviewer.firstName",
                                                                    ""
                                                                ),
                                                                slug: getProp(task, "reviewer.slug", ""),
                                                            }}
                                                        />
                                                    </Col>
                                                    <Col>
                                                        <Typography.Link
                                                            className="text-grey-9"
                                                            href={`/${getProp(task, "reviewer.slug", "")}`}
                                                        >
                                                            {getProp(task, "reviewer.firstName", "")}
                                                        </Typography.Link>
                                                    </Col>
                                                </Row>
                                            </Row>
                                        )}

                                        {tags.length > 0 && (
                                            <Row
                                                style={{marginTop: 10}}
                                                className="text-sm mt-8 tag-bottom-0"
                                            >
                                                <strong className="my-auto">Tags:&nbsp;</strong>
                                                {tags.map((tag: any, taskIndex: number) => (
                                                    <Tag key={`stack-${taskIndex}`}>{tag.name}</Tag>
                                                ))}
                                            </Row>
                                        )}

                                        {getProp(task, "capability.id", null) && (
                                            <Row className="text-sm mt-8">
                                                <strong className="my-auto">Related Capability:</strong>
                                                <Typography.Link
                                                    className="ml-5"
                                                    href={`${getBasePath()}/capabilities/${getProp(
                                                        task,
                                                        "capability.id"
                                                    )}`}
                                                >
                                                    {getProp(task, "capability.name", "")}
                                                </Typography.Link>
                                            </Row>
                                        )}
                                        {getProp(task, "initiative.id", null) && (
                                            <Row className="text-sm mt-8">
                                                <strong className="my-auto">Initiative:</strong>
                                                <Typography.Link
                                                    className="ml-5"
                                                    href={`${getBasePath()}/initiatives/${getProp(
                                                        task,
                                                        "initiative.id"
                                                    )}`}
                                                >
                                                    {getProp(task, "initiative.name", "")}
                                                </Typography.Link>
                                            </Row>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {getProp(task, "dependOn", []).length > 0 && (
                                <Collapse style={{marginTop: 30}}>
                                    <Panel header="Blocked by" key="1">
                                        <List
                                            bordered
                                            dataSource={getProp(task, "dependOn", [])}
                                            renderItem={(item: any) => (
                                                <List.Item>
                                                    <Link
                                                        href={`/${personSlug}/${item.product.slug}/tasks/${item.publishedId}`}
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </List.Item>
                                            )}
                                        />
                                    </Panel>
                                </Collapse>
                            )}
                            {getProp(task, "relatives", []).length > 0 && (
                                <Collapse style={{marginTop: 30}}>
                                    <Panel header="Dependant tasks" key="1">
                                        <List
                                            bordered
                                            dataSource={getProp(task, "relatives", [])}
                                            renderItem={(item: any) => (
                                                <List.Item>
                                                    <Link
                                                        href={`/${personSlug}/${item.product.slug}/tasks/${item.publishedId}`}
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </List.Item>
                                            )}
                                        />
                                    </Panel>
                                </Collapse>
                            )}

                            <div style={{marginTop: 30}}/>
                            <Comments objectId={getProp(task, "id", 0)} objectType="task"/>

                            <Attachments data={getProp(original, "task.attachment", [])}/>

                            {deleteModal && (
                                <DeleteModal
                                    modal={deleteModal}
                                    closeModal={() => showDeleteModal(false)}
                                    submit={deleteTask}
                                    title="Delete task"
                                />
                            )}
                            {leaveTaskModal && (
                                <CustomModal
                                    modal={leaveTaskModal}
                                    closeModal={() => showLeaveTaskModal(false)}
                                    submit={() => {
                                        showLeaveTaskModal(false);
                                        leaveTask().then();
                                    }}
                                    title="Leave the task"
                                    message="Do you really want to leave the task?"
                                    submitText="Yes, leave"
                                />
                            )}
                            {reviewTaskModal && (
                                <ToReviewModal
                                    modal={reviewTaskModal}
                                    closeModal={() => showReviewTaskModal(false)}
                                    submit={submitTask}
                                    files={files}
                                    setFiles={setFiles}
                                    fileList={fileList}
                                    setFileList={setFileList}
                                    deliveryMessage={deliveryMessage}
                                    setDeliveryMessage={setDeliveryMessage}
                                    message={task.title}
                                />
                            )}
                            {showEditModal && (
                                <AddTaskContainer
                                    modal={showEditModal}
                                    productSlug={String(productSlug)}
                                    modalType={true}
                                    closeModal={setShowEditModal}
                                    task={task}
                                    submit={fetchData}
                                    tasks={tasks}
                                />
                            )}
                            {rejectTaskModal && (
                                <CustomModal
                                    modal={rejectTaskModal}
                                    closeModal={() => showRejectTaskModal(false)}
                                    submit={rejectTask}
                                    title="Reject the work"
                                    message="Do you really want to reject the work?"
                                    submitText="Yes, reject"
                                />
                            )}
                            {approveTaskModal && (
                                <CustomModal
                                    modal={approveTaskModal}
                                    closeModal={() => showApproveTaskModal(false)}
                                    submit={approveTask}
                                    title="Approve the work"
                                    message="Do you really want to approve the work?"
                                    submitText="Yes, approve"
                                />
                            )}
                            {deliveryModal && (
                                <DeliveryMessageModal
                                    modal={deliveryModal}
                                    closeModal={() => setDeliveryModal(false)}
                                    submit={approveTask}
                                    reject={rejectTask}
                                    taskId={taskId}/>
                            )}
                        </>
                    )}
                    <Modal
                        title="Contribution License Agreement"
                        okText="I Agree"
                        visible={agreementModalVisible}
                        onOk={handleIAgree}
                        onCancel={() => setAgreementModalVisible(false)}
                        width={1000}
                        maskClosable={false}
                    >
                        <p className="html-description">{parse(license)}</p>
                    </Modal>
                </Spin>
            </LeftPanelContainer>
        </>
    );
};

const mapStateToProps = (state: any) => ({
    user: state.user,
    currentProduct: state.work.currentProduct || {},
    loginUrl: state.work.loginUrl,
    registerUrl: state.work.registerUrl
});

const mapDispatchToProps = (dispatch: any) => ({
    userLogInAction: (data: UserState) => dispatch(userLogInAction(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Task);
