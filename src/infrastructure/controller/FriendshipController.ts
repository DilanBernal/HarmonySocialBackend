import { Request, Response } from "express";
import FriendshipService from "../../application/services/FriendshipService";
import { ApplicationResponse } from "../../application/shared/ApplicationReponse";

export default class FriendshipController {
  constructor(private friendshipService: FriendshipService) {}

  /**

   * @param req Request con los IDs de usuario y amigo en el body
   * @param res Response con el resultado de la operación
   * @returns Respuesta HTTP con estado 201 si se creó correctamente, 200 si ya existe relación, 400 si hubo error
   */
  async newFriendship(req: Request, res: Response) {
    try {
      const authenticatedUserId = (req as any).userId as number | undefined;

      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (req.body.user_id === req.body.friend_id) {
        return res.status(422).send("El usuario no se puede agregar a si mismo como amigo");
      }

      // Ensure that the authenticated user is the same as the creator (user_id)
      if (Number(req.body.user_id) !== Number(authenticatedUserId)) {
        return res
          .status(403)
          .json({ message: "No está autorizado para crear solicitudes en nombre de otro usuario" });
      }
      const servResponse = await this.friendshipService.createNewFriendship(req.body);
      if (!servResponse!.success) {
        return res.status(400).json(servResponse?.error);
      }

      if (typeof servResponse.data === "string") {
        return res.status(200).json({
          message: servResponse.data,
        });
      }

      return res.status(201).json({
        message: "Solicitud de amistad creada correctamente",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: "Ocurrió un error inesperado",
          details: error.message,
        });
      }
      return res.status(500).json({ message: "Error desconocido" });
    }
  }

  async getCommonFriendships(req: Request, res: Response) {
    try {
      const userId: number = (req as any).userId;

      if (!userId) {
        res.status(401).json({ message: "Necesita estar logeado" });
      }
      const response = await this.friendshipService.getCommonFriendships(
        userId,
        Number(req.query.objId),
      );

      if (!response.success) {
        res.status(400).send("Ocurrio un error al traer los amigos" + response.error?.message);
      }

      res.status(200).json(response.data);
    } catch (error) {}
  }

  /**
   * Acepta una solicitud de amistad pendiente
   * @param req Request con el ID de la amistad en los parámetros
   * @param res Response con el resultado de la operación
   * @returns Respuesta HTTP con estado 200 si se aceptó correctamente o hay un mensaje informativo, 400 si hubo error
   */
  async acceptFriendship(req: Request, res: Response) {
    const { id } = req.query;
    const authenticatedUserId = (req as any).userId as number | undefined;
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    try {
      // Before calling service, validate that the authenticated user is the friend (receiver)
      // We need to fetch the friendship to check friend_id
      const friendshipCheck = await this.friendshipService.getFriendshipById(Number(id));
      if (!friendshipCheck.success) {
        return res.status(400).json(friendshipCheck.error);
      }
      const friendship = friendshipCheck.data;
      if (!friendship) {
        return res.status(404).json({ message: "Solicitud de amistad no encontrada" });
      }

      if (Number(friendship.friend_id) !== Number(authenticatedUserId)) {
        return res.status(403).json({ message: "Solo el destinatario puede aceptar la solicitud" });
      }

      const servResponse = await this.friendshipService.aceptFriendship(Number(id));
      if (!servResponse.success) {
        return res.status(400).json(servResponse.error);
      }

      // Si la respuesta contiene un mensaje informativo (string)
      if (typeof servResponse.data === "string") {
        return res.status(200).json({
          message: servResponse.data,
        });
      }

      return res.status(200).json({
        message: "Solicitud de amistad aceptada correctamente",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: "Ocurrió un error inesperado",
          details: error.message,
        });
      }
      return res.status(500).json({ message: "Error desconocido" });
    }
  }

  /**
   * Rechaza una solicitud de amistad pendiente
   * @param req Request con el ID de la amistad en los parámetros
   * @param res Response con el resultado de la operación
   * @returns Respuesta HTTP con estado 200 si se rechazó correctamente o hay un mensaje informativo, 400 si hubo error
   */
  async rejectFriendship(req: Request, res: Response) {
    const { id } = req.query;
    const authenticatedUserId = (req as any).userId as number | undefined;
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    try {
      // Validate actor is the friend (recipient)
      const friendshipCheck = await this.friendshipService.getFriendshipById(Number(id));
      if (!friendshipCheck.success) {
        return res.status(400).json(friendshipCheck.error);
      }
      const friendship = friendshipCheck.data;
      if (!friendship) {
        return res.status(404).json({ message: "Solicitud de amistad no encontrada" });
      }

      if (Number(friendship.friend_id) !== Number(authenticatedUserId)) {
        return res
          .status(403)
          .json({ message: "Solo el destinatario puede rechazar la solicitud" });
      }

      const servResponse = await this.friendshipService.rejectFriendship(Number(id));
      if (!servResponse.success) {
        return res.status(400).json(servResponse.error);
      }

      // Si la respuesta contiene un mensaje informativo (string)
      if (typeof servResponse.data === "string") {
        return res.status(200).json({
          message: servResponse.data,
        });
      }

      return res.status(200).json({
        message: "Solicitud de amistad rechazada correctamente",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: "Ocurrió un error inesperado",
          details: error.message,
        });
      }
      return res.status(500).json({ message: "Error desconocido" });
    }
  }

  /**
   * Obtiene todas las amistades de un usuario específico
   * @param req Request con el ID del usuario en los parámetros
   * @param res Response con el resultado de la operación
   * @returns Respuesta HTTP con estado 200 y la lista de amistades, 400 si hubo error
   */
  async getUserFriendships(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const servResponse = await this.friendshipService.getUserFriendships(Number(id));
      if (!servResponse.success) {
        return res.status(400).json(servResponse.error);
      }
      return res.status(200).json({
        message: "Amistades obtenidas correctamente",
        data: servResponse.data,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: "Ocurrió un error inesperado",
          details: error.message,
        });
      }
      return res.status(500).json({ message: "Error desconocido" });
    }
  }

  /**
   * Elimina una amistad por su ID
   * @param req Request con el ID de la amistad en los parámetros
   * @param res Response con el resultado de la operación
   * @returns Respuesta HTTP con estado 200 si se eliminó correctamente, 400 si hubo error
   */
  async deleteFriendshipById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const servResponse = await this.friendshipService.deleteFriendshipById(Number(id));
      if (!servResponse.success) {
        return res.status(400).json(servResponse.error);
      }
      return res.status(200).json({
        message: "Amistad eliminada correctamente",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: "Ocurrió un error inesperado",
          details: error.message,
        });
      }
      return res.status(500).json({ message: "Error desconocido" });
    }
  }

  /**
   * Elimina una amistad por los IDs de los usuarios
   * @param req Request con los IDs de usuario y amigo en el body
   * @param res Response con el resultado de la operación
   * @returns Respuesta HTTP con estado 200 si se eliminó correctamente, 400 si hubo error
   */
  async deleteFriendship(req: Request, res: Response) {
    try {
      const servResponse = await this.friendshipService.deleteFriendship(req.body);
      if (!servResponse.success) {
        return res.status(400).json(servResponse.error);
      }
      return res.status(200).json({
        message: "Amistad eliminada correctamente",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: "Ocurrió un error inesperado",
          details: error.message,
        });
      }
      return res.status(500).json({ message: "Error desconocido" });
    }
  }
}
