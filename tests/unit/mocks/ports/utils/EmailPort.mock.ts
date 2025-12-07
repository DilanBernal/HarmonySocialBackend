import EmailPort from "../../../../../src/domain/ports/utils/EmailPort";

const createEmailPortMock = (): jest.Mocked<EmailPort> => {
  return {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendEmails: jest.fn().mockResolvedValue(true),
  };
};

export default createEmailPortMock;
