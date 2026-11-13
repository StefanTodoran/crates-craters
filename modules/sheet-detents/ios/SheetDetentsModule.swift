import ExpoModulesCore
import UIKit

/// React Native's Modal can present a page sheet but can't set its detents. Calling
/// prepareNextSheet just before a Modal opens makes that sheet open at half height
/// (draggable to full), with a clear background so the system sheet material (Liquid
/// Glass on iOS 26) shows. Detents have to be set before presentation, or the sheet
/// opens at full height and then snaps down.
public class SheetDetentsModule: Module {
  /// Set from JS, consumed by the next React Native modal presented as a sheet.
  static var pendingClearBackground: Bool?

  public func definition() -> ModuleDefinition {
    Name("SheetDetents")

    OnCreate {
      UIViewController.installSheetDetentsHook()
    }

    // Synchronous, so it runs before the render that opens the Modal is mounted.
    Function("prepareNextSheet") { (clearBackground: Bool) in
      Self.pendingClearBackground = clearBackground
    }
  }

  static func configure(_ presented: UIViewController) {
    guard let clearBackground = pendingClearBackground,
          NSStringFromClass(type(of: presented)).contains("ModalHostViewController"),
          let sheet = presented.sheetPresentationController else { return }
    pendingClearBackground = nil
    sheet.detents = [.medium(), .large()]
    sheet.selectedDetentIdentifier = .medium
    sheet.prefersGrabberVisible = true
    if clearBackground {
      presented.view.backgroundColor = .clear
    }
  }
}

extension UIViewController {
  private static var hookInstalled = false

  static func installSheetDetentsHook() {
    guard !hookInstalled,
          let original = class_getInstanceMethod(UIViewController.self, #selector(present(_:animated:completion:))),
          let replacement = class_getInstanceMethod(UIViewController.self, #selector(sheetDetents_present(_:animated:completion:)))
    else { return }
    hookInstalled = true
    method_exchangeImplementations(original, replacement)
  }

  @objc private func sheetDetents_present(_ controller: UIViewController, animated: Bool, completion: (() -> Void)?) {
    SheetDetentsModule.configure(controller)
    // Implementations are swapped, so this calls UIKit's original present.
    sheetDetents_present(controller, animated: animated, completion: completion)
  }
}
