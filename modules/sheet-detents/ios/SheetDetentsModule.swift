import ExpoModulesCore
import UIKit

/// React Native's Modal can present a page sheet but can't set its detents. This adjusts
/// the sheet that's currently on screen: open at half height (draggable to full), and
/// with a clear background so the system sheet material (Liquid Glass on iOS 26) shows.
public class SheetDetentsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SheetDetents")

    AsyncFunction("configurePresentedSheet") { (clearBackground: Bool) in
      guard let presented = Self.topPresentedController(),
            let sheet = presented.sheetPresentationController else { return }
      sheet.animateChanges {
        sheet.detents = [.medium(), .large()]
        sheet.selectedDetentIdentifier = .medium
        sheet.prefersGrabberVisible = true
      }
      if clearBackground {
        presented.view.backgroundColor = .clear
      }
    }.runOnQueue(.main)
  }

  private static func topPresentedController() -> UIViewController? {
    let window = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
    var controller = window?.rootViewController
    while let next = controller?.presentedViewController {
      controller = next
    }
    return controller === window?.rootViewController ? nil : controller
  }
}
